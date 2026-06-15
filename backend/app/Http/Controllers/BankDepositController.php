<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BankDeposit;
use Illuminate\Support\Facades\Storage;

class BankDepositController extends Controller
{
    /**
     * User submits a bank transfer receipt for review.
     */
    public function submit(Request $request)
    {
        $request->validate([
            'amount'  => 'required|numeric|min:1|max:10000',
            'receipt' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:10240', // 10MB max
        ]);

        $user = $request->user();

        // Store receipt
        $file = $request->file('receipt');
        $path = $file->store('receipts', 'public');

        // Build a URL using the actual request's scheme+host (not APP_URL which may be wrong)
        $storagePath = Storage::url($path); // e.g. /storage/receipts/filename.pdf
        $url = $request->getSchemeAndHttpHost() . $storagePath;

        $deposit = BankDeposit::create([
            'user_id'      => $user->id,
            'amount'       => $request->input('amount'),
            'receipt_path' => $path,
            'receipt_url'  => $url,
            'status'       => 'pending',
        ]);

        // Notify all admins
        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notifications()->create([
                'type' => 'system',
                'title' => 'New Bank Deposit',
                'message' => "{$user->name} has submitted a new bank deposit of $" . number_format($request->input('amount'), 2) . " AUD pending approval.",
            ]);
        }

        return response()->json([
            'message' => 'Receipt submitted. Your deposit is pending admin approval.',
            'deposit' => $deposit,
        ], 201);
    }

    /**
     * List the authenticated user's own deposit submissions.
     */
    public function myDeposits(Request $request)
    {
        $deposits = BankDeposit::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($deposits);
    }
}
