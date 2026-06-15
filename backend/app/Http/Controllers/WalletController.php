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

        // Only artists and studios have creator earnings
        if (!in_array($user->role, ['artist', 'studio'])) {
            return response()->json(['message' => 'Not a creator account.'], 403);
        }

        $artistId = $user->artist ? $user->artist->id : null;
        $studioId = $user->studio ? $user->studio->id : null;

        // If user has no linked artist or studio record yet, return empty totals
        if (!$artistId && !$studioId) {
            return response()->json([
                'available' => 0,
                'pending' => 0,
                'withdrawn' => 0,
                'history' => ['data' => []]
            ]);
        }

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

    /**
     * Handle user-to-user credit transfer requests (Initiate).
     */
    public function transfer(Request $request, \App\Services\WalletService $walletService)
    {
        $request->validate([
            'wallet_id' => 'required|string',
            'amount'    => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'pin'       => 'nullable|string|size:4|regex:/^[0-9]+$/',
        ]);

        // Parse RURU-XXXXXX format to a numeric user ID
        $walletId = strtoupper(trim($request->wallet_id));
        if (!preg_match('/^RURU-(\d+)$/', $walletId, $matches)) {
            return response()->json(['message' => 'Invalid Wallet ID format. Expected RURU-XXXXXX.'], 422);
        }
        $receiverId = (int) $matches[1];

        $user = $request->user();
        $receiver = \App\Models\User::find($receiverId);

        if (!$receiver) {
            return response()->json(['message' => 'No account found with that Wallet ID.'], 422);
        }

        if ($user->id === $receiver->id) {
            return response()->json(['message' => 'You cannot transfer credits to yourself.'], 422);
        }

        // Validate wallet pin if the user has set one
        if (!is_null($user->wallet_pin)) {
            if (!$request->filled('pin')) {
                return response()->json(['message' => 'Wallet PIN is required for transfers.'], 422);
            }
            if (!\Illuminate\Support\Facades\Hash::check($request->pin, $user->wallet_pin)) {
                return response()->json(['message' => 'Incorrect Wallet PIN.'], 422);
            }
        }

        // Calculate available balance to verify they have sufficient funds (excluding pending/approved withdrawals)
        $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);
        $pendingWithdrawals = \App\Models\Withdrawal::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->sum('amount');
        
        $availableBalance = $wallet->balance - $pendingWithdrawals;

        if ($availableBalance < $request->amount) {
            return response()->json(['message' => 'Insufficient wallet balance (including pending withdrawals).'], 422);
        }

        try {
            $transfer = $walletService->transfer(
                $user,
                $receiver,
                (float)$request->amount,
                $request->description
            );

            // Send notifications about initiation
            $receiver->notifications()->create([
                'type' => 'transaction',
                'title' => 'Incoming Credit Transfer',
                'message' => "{$user->name} has initiated a transfer of $" . number_format($request->amount, 2) . " AUD to you. Please accept it in your Wallet.",
            ]);

            $user->notifications()->create([
                'type' => 'transaction',
                'title' => 'Transfer Initiated',
                'message' => "You have initiated a transfer of $" . number_format($request->amount, 2) . " AUD to {$receiver->name}. The funds are held until accepted.",
            ]);

            return response()->json([
                'message' => 'Transfer initiated successfully.',
                'transfer' => $transfer,
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Get pending P2P transfers for the current user.
     */
    public function pendingTransfers(Request $request)
    {
        $user = $request->user();

        $incoming = \App\Models\Transfer::with('sender')
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->get();

        $outgoing = \App\Models\Transfer::with('receiver')
            ->where('sender_id', $user->id)
            ->where('status', 'pending')
            ->get();

        return response()->json([
            'incoming' => $incoming,
            'outgoing' => $outgoing,
        ]);
    }

    /**
     * Accept a pending transfer.
     */
    public function acceptTransfer(Request $request, $id, \App\Services\WalletService $walletService)
    {
        $user = $request->user();
        $transfer = \App\Models\Transfer::with(['sender', 'receiver'])->findOrFail($id);

        if ($transfer->receiver_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        try {
            $walletService->acceptTransfer($transfer);

            // Send notifications about acceptance
            $transfer->sender->notifications()->create([
                'type' => 'transaction',
                'title' => 'Transfer Accepted',
                'message' => "{$user->name} has accepted your transfer of $" . number_format($transfer->amount, 2) . " AUD.",
            ]);

            $user->notifications()->create([
                'type' => 'transaction',
                'title' => 'Transfer Accepted',
                'message' => "You have accepted the transfer of $" . number_format($transfer->amount, 2) . " AUD from {$transfer->sender->name}.",
            ]);

            return response()->json(['message' => 'Transfer accepted and wallet credited.']);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Reject a pending transfer.
     */
    public function rejectTransfer(Request $request, $id, \App\Services\WalletService $walletService)
    {
        $user = $request->user();
        $transfer = \App\Models\Transfer::with(['sender', 'receiver'])->findOrFail($id);

        if ($transfer->receiver_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        try {
            $walletService->rejectTransfer($transfer);

            // Send notification about rejection
            $transfer->sender->notifications()->create([
                'type' => 'transaction',
                'title' => 'Transfer Rejected',
                'message' => "{$user->name} has rejected your transfer of $" . number_format($transfer->amount, 2) . " AUD. The funds have been refunded to your wallet.",
            ]);

            return response()->json(['message' => 'Transfer rejected and funds returned to sender.']);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Cancel a pending transfer.
     */
    public function cancelTransfer(Request $request, $id, \App\Services\WalletService $walletService)
    {
        $user = $request->user();
        $transfer = \App\Models\Transfer::with(['sender', 'receiver'])->findOrFail($id);

        if ($transfer->sender_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        try {
            $walletService->cancelTransfer($transfer);

            // Send notification about cancellation
            $transfer->receiver->notifications()->create([
                'type' => 'transaction',
                'title' => 'Transfer Cancelled',
                'message' => "{$user->name} has cancelled the pending transfer of $" . number_format($transfer->amount, 2) . " AUD.",
            ]);

            return response()->json(['message' => 'Transfer cancelled successfully.']);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}

