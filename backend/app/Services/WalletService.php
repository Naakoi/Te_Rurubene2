<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Exception;

class WalletService
{
    /**
     * Generate a tamper-proof signature for a transaction.
     */
    public function generateSignature($walletId, $amount, $previousBalance, $type, $timestamp)
    {
        $data = "{$walletId}:{$amount}:{$previousBalance}:{$type}:{$timestamp}";
        return hash_hmac('sha256', $data, config('app.key'));
    }

    /**
     * Deduct funds securely from a wallet.
     */
    public function debit(User $user, float $amount, string $source, string $description, $referenceId = null)
    {
        return DB::transaction(function () use ($user, $amount, $source, $description, $referenceId) {
            $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            $previousBalance = $wallet->balance;

            if ($previousBalance < $amount) {
                throw new Exception("Insufficient wallet balance.");
            }

            $wallet->decrement('balance', $amount);

            $timestamp = now()->timestamp;
            $signature = $this->generateSignature($wallet->id, -$amount, $previousBalance, 'debit', $timestamp);

            return Transaction::create([
                'wallet_id' => $wallet->id,
                'amount' => -$amount,
                'type' => 'debit',
                'source' => $source,
                'description' => $description,
                'reference_id' => $referenceId,
                'status' => 'completed',
                'signature' => $signature,
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Credit funds securely to a wallet.
     */
    public function credit(User $user, float $amount, string $source, string $description, $referenceId = null)
    {
        return DB::transaction(function () use ($user, $amount, $source, $description, $referenceId) {
            $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            $previousBalance = $wallet->balance;
            $wallet->increment('balance', $amount);

            $timestamp = now()->timestamp;
            $signature = $this->generateSignature($wallet->id, $amount, $previousBalance, 'credit', $timestamp);

            return Transaction::create([
                'wallet_id' => $wallet->id,
                'amount' => $amount,
                'type' => 'credit',
                'source' => $source,
                'description' => $description,
                'reference_id' => $referenceId,
                'status' => 'completed',
                'signature' => $signature,
                'created_at' => now(),
            ]);
        });
    }
}
