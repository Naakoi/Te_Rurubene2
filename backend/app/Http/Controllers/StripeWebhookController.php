<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PaymentService;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;
use UnexpectedValueException;

class StripeWebhookController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Handle incoming Stripe webhook events.
     *
     * This endpoint is public (no Sanctum auth) but secured via Stripe's
     * cryptographic webhook signature verification using the signing secret.
     */
    public function handle(Request $request)
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret    = config('services.stripe.webhook_secret');

        // 1. Verify the webhook signature — reject any tampered payloads
        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (UnexpectedValueException $e) {
            Log::warning('Stripe webhook: invalid payload', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook: signature mismatch', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // 2. Route event types
        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($event->data->object);
                break;

            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($event->data->object);
                break;

            default:
                // Silently acknowledge unhandled events — Stripe expects 200
                Log::info('Stripe webhook: unhandled event type', ['type' => $event->type]);
        }

        // 3. Always return 200 to acknowledge receipt — Stripe will retry on failure
        return response()->json(['received' => true]);
    }

    /**
     * Credit the user's wallet when Stripe confirms a successful payment.
     */
    private function handlePaymentIntentSucceeded(object $paymentIntent): void
    {
        try {
            $this->paymentService->finalizePaymentByIntentId($paymentIntent->id);
            Log::info('Stripe webhook: wallet credited', ['intent_id' => $paymentIntent->id]);
        } catch (\Exception $e) {
            // Log but don't throw — we must return 200 to Stripe regardless
            Log::error('Stripe webhook: failed to finalize payment', [
                'intent_id' => $paymentIntent->id,
                'error'     => $e->getMessage(),
            ]);
        }
    }

    /**
     * Log payment failures for monitoring and alerting.
     */
    private function handlePaymentIntentFailed(object $paymentIntent): void
    {
        Log::warning('Stripe webhook: payment failed', [
            'intent_id'      => $paymentIntent->id,
            'failure_reason' => $paymentIntent->last_payment_error?->message ?? 'Unknown',
        ]);

        // Optionally mark the transaction as failed in the DB
        $transaction = \App\Models\Transaction::where('reference_id', $paymentIntent->id)
            ->where('status', 'pending')
            ->first();

        if ($transaction) {
            $transaction->update(['status' => 'failed']);
        }
    }
}
