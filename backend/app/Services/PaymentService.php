<?php

namespace App\Services;

use App\Models\User;
use App\Models\Transaction;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Exception;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class PaymentService
{
    /**
     * Initialize a payment intent.
     *
     * Routes to the simulation path (testing mode ON) or the live Stripe
     * path (testing mode OFF) based on the admin-controlled cache flag.
     */
    public function createTopupIntent(User $user, float $amount, string $source)
    {
        // 1. Create a PENDING transaction record (shared by both paths)
        $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);

        $transaction = Transaction::create([
            'wallet_id'    => $wallet->id,
            'amount'       => $amount,
            'type'         => 'credit',
            'source'       => $source,
            'status'       => 'pending',
            'description'  => 'Wallet top-up (Pending)',
            'reference_id' => 'INT_' . Str::random(16),
        ]);

        // 2. Route based on testing mode
        if (Cache::get('wallet_testing_mode', true)) {
            return $this->simulationIntent($transaction);
        }

        return $this->stripeIntent($transaction, $amount);
    }

    /**
     * Simulation path — generates a secure signed URL that acts as a mock
     * payment gateway callback. Only active when testing mode is ON.
     */
    private function simulationIntent(Transaction $transaction): array
    {
        $simulationUrl = URL::temporarySignedRoute(
            'payment.webhook.simulate',
            now()->addMinutes(30),
            ['transaction_id' => $transaction->id]
        );

        return [
            'intent_id'      => $transaction->reference_id,
            'transaction_id' => $transaction->id,
            'amount'         => $transaction->amount,
            'currency'       => 'AUD',
            'status'         => 'requires_action',
            'mode'           => 'simulation',
            'checkout_url'   => $simulationUrl,
        ];
    }

    /**
     * Live Stripe path — creates a real PaymentIntent via Stripe API and
     * returns the client_secret for frontend Stripe.js confirmation.
     * Only active when testing mode is OFF.
     */
    private function stripeIntent(Transaction $transaction, float $amount): array
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $intent = PaymentIntent::create([
            'amount'   => (int) round($amount * 100), // Stripe works in cents
            'currency' => 'aud',
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => [
                'transaction_id' => $transaction->id,
                'reference_id'   => $transaction->reference_id,
            ],
        ]);

        // Store Stripe's intent ID as reference so the webhook can find this transaction
        $transaction->update(['reference_id' => $intent->id]);

        return [
            'intent_id'      => $intent->id,
            'transaction_id' => $transaction->id,
            'amount'         => $amount,
            'currency'       => 'AUD',
            'status'         => 'requires_payment_method',
            'mode'           => 'live',
            'client_secret'  => $intent->client_secret,
            'publishable_key' => config('services.stripe.key'),
        ];
    }

    /**
     * Finalize a payment — called by both the simulation webhook and the
     * Stripe webhook handler after successful payment verification.
     */
    public function finalizePayment(int $transactionId)
    {
        $transaction = Transaction::findOrFail($transactionId);

        if ($transaction->status !== 'pending') {
            throw new Exception('Transaction is already ' . $transaction->status);
        }

        $commerceService = app(CommerceService::class);
        $user = $transaction->wallet->user;

        return DB::transaction(function () use ($transaction, $user, $commerceService) {
            $transaction->update([
                'status'      => 'completed',
                'description' => 'Wallet top-up via ' . ucfirst($transaction->source),
            ]);

            $commerceService->creditFunds(
                $user,
                $transaction->amount,
                $transaction->source,
                'Verified top-up: ' . $transaction->reference_id,
                $transaction->id
            );

            return true;
        });
    }

    /**
     * Finalize a payment by Stripe PaymentIntent ID (used by the webhook handler).
     */
    public function finalizePaymentByIntentId(string $stripeIntentId)
    {
        $transaction = Transaction::where('reference_id', $stripeIntentId)
            ->where('status', 'pending')
            ->firstOrFail();

        return $this->finalizePayment($transaction->id);
    }
}
