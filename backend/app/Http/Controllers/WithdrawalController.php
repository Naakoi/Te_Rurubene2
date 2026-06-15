<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Withdrawal;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Exception;

class WithdrawalController extends Controller
{
    protected $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * User lists their own withdrawal requests.
     */
    public function myWithdrawals(Request $request)
    {
        $withdrawals = Withdrawal::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($withdrawals);
    }

    /**
     * User submits a new withdrawal request.
     */
    public function request(Request $request)
    {
        $request->validate([
            'amount'         => 'required|numeric|min:5|max:10000',
            'method'         => 'required|string|in:anz,mpaisa,other',
            'account_name'   => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'bank_name'      => 'required|string|max:255',
        ]);

        $user = $request->user();
        $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);
        $amount = $request->input('amount');

        // Calculate pending/approved amounts to prevent double-spending
        $pendingAmount = Withdrawal::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->sum('amount');

        $available = $wallet->balance - $pendingAmount;

        if ($available < $amount) {
            return response()->json([
                'message' => 'Insufficient wallet balance (including pending withdrawals).'
            ], 422);
        }

        $withdrawal = Withdrawal::create([
            'user_id'        => $user->id,
            'amount'         => $amount,
            'method'         => $request->input('method'),
            'account_name'   => $request->input('account_name'),
            'account_number' => $request->input('account_number'),
            'bank_name'      => $request->input('bank_name'),
            'status'         => 'pending',
        ]);

        // Notify admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notifications()->create([
                'type'    => 'system',
                'title'   => 'New Withdrawal Request',
                'message' => "{$user->name} has requested a withdrawal of $" . number_format($amount, 2) . " AUD.",
            ]);
        }

        return response()->json([
            'message'    => 'Withdrawal request submitted successfully.',
            'withdrawal' => $withdrawal,
        ], 201);
    }

    /**
     * User confirms they received the funds.
     */
    public function confirm(Request $request, $id)
    {
        $withdrawal = Withdrawal::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        if ($withdrawal->status !== 'approved') {
            return response()->json([
                'message' => 'This withdrawal is not in a confirmable state.'
            ], 422);
        }

        try {
            DB::transaction(function () use ($withdrawal) {
                // Debit the wallet
                $transaction = $this->walletService->debit(
                    $withdrawal->user,
                    (float)$withdrawal->amount,
                    'withdrawal',
                    "Withdrawal confirmed: {$withdrawal->bank_name} transfer.",
                    $withdrawal->id
                );

                $withdrawal->update([
                    'status'         => 'confirmed',
                    'confirmed_at'   => now(),
                    'transaction_id' => $transaction->id,
                ]);
            });

            // Notify admins
            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                $admin->notifications()->create([
                    'type'    => 'system',
                    'title'   => 'Withdrawal Confirmed by User',
                    'message' => "{$withdrawal->user->name} has confirmed receipt of $" . number_format($withdrawal->amount, 2) . " AUD.",
                ]);
            }

            return response()->json([
                'message'    => 'Withdrawal confirmed and funds debited from wallet.',
                'withdrawal' => $withdrawal->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Admin lists all withdrawals.
     */
    public function adminList(Request $request)
    {
        $status = $request->query('status');
        $query = Withdrawal::with('user:id,name,email')->latest();

        if ($status) {
            $query->where('status', $status);
        }

        return response()->json($query->get());
    }

    /**
     * Admin approves a request and uploads the transfer receipt.
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'receipt' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:10240', // 10MB
            'note'    => 'nullable|string|max:500',
        ]);

        $withdrawal = Withdrawal::findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json([
                'message' => 'This withdrawal is not pending.'
            ], 422);
        }

        // Store receipt
        $file = $request->file('receipt');
        $path = $file->store('receipts', 'public');
        $storagePath = Storage::url($path);
        $url = $request->getSchemeAndHttpHost() . $storagePath;

        $withdrawal->update([
            'status'       => 'approved',
            'receipt_path' => $path,
            'receipt_url'  => $url,
            'approved_by'  => $request->user()->id,
            'approved_at'  => now(),
            'admin_notes'  => $request->input('note'),
        ]);

        // Notify user
        $withdrawal->user->notifications()->create([
            'type'    => 'transaction',
            'title'   => 'Withdrawal Request Approved',
            'message' => 'Your withdrawal request of $' . number_format($withdrawal->amount, 2) . ' AUD has been approved. Please view the bank receipt and confirm to complete.',
        ]);

        return response()->json([
            'message'    => 'Withdrawal approved and receipt uploaded.',
            'withdrawal' => $withdrawal->fresh(),
        ]);
    }

    /**
     * Admin rejects a request.
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'note' => 'nullable|string|max:500',
        ]);

        $withdrawal = Withdrawal::findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json([
                'message' => 'This withdrawal is not pending.'
            ], 422);
        }

        $withdrawal->update([
            'status'       => 'rejected',
            'approved_by'  => $request->user()->id,
            'approved_at'  => now(),
            'admin_notes'  => $request->input('note') ?: 'Request could not be processed.',
        ]);

        // Notify user
        $withdrawal->user->notifications()->create([
            'type'    => 'transaction',
            'title'   => 'Withdrawal Request Rejected',
            'message' => 'Your withdrawal request of $' . number_format($withdrawal->amount, 2) . ' AUD was rejected. Reason: ' . $request->input('note'),
        ]);

        return response()->json([
            'message'    => 'Withdrawal request rejected.',
            'withdrawal' => $withdrawal->fresh(),
        ]);
    }
}
