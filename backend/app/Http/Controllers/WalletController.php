<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

use App\Services\PaymentService;
use Illuminate\Support\Facades\Cache;
use Exception;

class WalletController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }
    /**
     * Get current user's wallet balance and transaction history.
     */
    public function index(Request $request)
    {
        $wallet = $request->user()->wallet()->firstOrCreate(['currency' => 'AUD']);
        $transactions = $wallet->transactions()->with('relatedUser')->latest()->paginate(20);

        return response()->json([
            'balance' => $wallet->balance,
            'currency' => $wallet->currency,
            'transactions' => $transactions
        ]);
    }

    /**
     * Get dynamic wallet settings (e.g. testing mode).
     */
    public function getConfig()
    {
        return response()->json([
            'wallet_testing_mode' => Cache::get('wallet_testing_mode', true)
        ]);
    }

    /**
     * Get creator earnings summary.
     */
    public function earnings(Request $request)
    {
        $user = $request->user();
        
        $artistId = $user->artist ? $user->artist->id : null;
        $studioId = $user->studio ? $user->studio->id : null;

        $earningsQuery = \App\Models\CreatorEarning::where(function ($query) use ($artistId, $studioId) {
            if ($artistId) {
                $query->orWhere(function ($q) use ($artistId) {
                    $q->where('recipient_type', 'artist')->where('recipient_id', $artistId);
                });
            }
            if ($studioId) {
                $query->orWhere(function ($q) use ($studioId) {
                    $q->where('recipient_type', 'studio')->where('recipient_id', $studioId);
                });
            }
        });

        // Calculate totals
        $available = (clone $earningsQuery)->where('status', 'available')->sum('amount');
        $pending = (clone $earningsQuery)->where('status', 'pending')->sum('amount');
        $withdrawn = (clone $earningsQuery)->where('status', 'withdrawn')->sum('amount');

        $history = $earningsQuery->with('purchase')->latest()->paginate(20);

        return response()->json([
            'available' => $available,
            'pending' => $pending,
            'withdrawn' => $withdrawn,
            'history' => $history
        ]);
    }

    /**
     * Get user's purchased content (Library)
     */
    public function library(Request $request)
    {
        $user = $request->user();
        $library = \App\Models\PurchasedContent::with('content')
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(50);

        return response()->json($library);
    }

    /**
     * Initialize a wallet top-up by creating a payment intent.
     */
    public function initializeTopup(Request $request)
    {
        if (!Cache::get('wallet_testing_mode', true)) {
            return response()->json(['message' => 'Simulated wallet payments are disabled for security reasons.'], 403);
        }

        $request->validate([
            'amount' => 'required|numeric|min:1',
            'source' => 'required|string|in:stripe,paypal'
        ]);

        try {
            $intent = $this->paymentService->createTopupIntent(
                $request->user(), 
                $request->amount, 
                $request->source
            );

            return response()->json($intent);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Secure Webhook Simulation (Target of Signed Route)
     */
    public function confirmSimulation(Request $request)
    {
        if (!Cache::get('wallet_testing_mode', true)) {
            abort(403, 'Simulated wallet payments are disabled for security reasons.');
        }

        if (!$request->hasValidSignature()) {
            abort(401, 'Invalid or expired payment signature.');
        }

        $transactionId = $request->transaction_id;

        try {
            $this->paymentService->finalizePayment($transactionId);
            return response()->json(['message' => 'Payment confirmed and wallet credited.']);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Deprecated Mock top-up (Keep as stub for legacy support if needed, but disable logic)
     */
    public function topup(Request $request)
    {
        return response()->json(['message' => 'Direct top-up disabled. Please use /wallet/topup/intent'], 403);
    }
}
