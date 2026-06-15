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

    /**
     * Transfer funds securely from one user to another (Initiate: funds held in pending state).
     */
    public function transfer(User $sender, User $receiver, float $amount, ?string $description = null)
    {
        if ($sender->id === $receiver->id) {
            throw new Exception("You cannot transfer credits to yourself.");
        }

        return DB::transaction(function () use ($sender, $receiver, $amount, $description) {
            // Obtain sender's wallet
            $senderWallet = $sender->wallet()->firstOrCreate(['currency' => 'AUD']);
            $lockedSenderWallet = Wallet::where('id', $senderWallet->id)->lockForUpdate()->first();

            $previousSenderBalance = $lockedSenderWallet->balance;

            if ($previousSenderBalance < $amount) {
                throw new Exception("Insufficient wallet balance.");
            }

            // Adjust balance immediately to reserve the credits
            $lockedSenderWallet->decrement('balance', $amount);

            $timestamp = now()->timestamp;

            // Generate signature for the pending debit
            $senderSig = $this->generateSignature($lockedSenderWallet->id, -$amount, $previousSenderBalance, 'debit', $timestamp);

            // Create a pending transaction log for the sender
            $senderTx = Transaction::create([
                'wallet_id' => $lockedSenderWallet->id,
                'amount' => -$amount,
                'type' => 'debit',
                'source' => 'transfer',
                'description' => $description ?: "Transfer to {$receiver->name}",
                'related_user_id' => $receiver->id,
                'status' => 'pending',
                'signature' => $senderSig,
                'created_at' => now(),
            ]);

            // Create the Transfer tracking record
            $transfer = \App\Models\Transfer::create([
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'amount' => $amount,
                'description' => $description,
                'status' => 'pending',
                'sender_transaction_id' => $senderTx->id,
            ]);

            return $transfer;
        });
    }

    /**
     * Accept a pending transfer: recipient gets credited, sender transaction completes.
     */
    public function acceptTransfer(\App\Models\Transfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            throw new Exception("This transfer is no longer pending.");
        }

        return DB::transaction(function () use ($transfer) {
            $sender = $transfer->sender;
            $receiver = $transfer->receiver;

            $senderWallet = $sender->wallet()->firstOrCreate(['currency' => 'AUD']);
            $receiverWallet = $receiver->wallet()->firstOrCreate(['currency' => 'AUD']);

            // Sort wallet IDs to prevent database deadlocks
            $firstId = min($senderWallet->id, $receiverWallet->id);
            $secondId = max($senderWallet->id, $receiverWallet->id);

            // Lock wallets in sorted order
            $wallet1 = Wallet::where('id', $firstId)->lockForUpdate()->first();
            $wallet2 = Wallet::where('id', $secondId)->lockForUpdate()->first();

            // Resolve locked wallets
            $lockedSenderWallet = ($senderWallet->id === $firstId) ? $wallet1 : $wallet2;
            $lockedReceiverWallet = ($receiverWallet->id === $firstId) ? $wallet1 : $wallet2;

            $previousReceiverBalance = $lockedReceiverWallet->balance;

            // Credit the recipient's wallet
            $lockedReceiverWallet->increment('balance', $transfer->amount);

            $timestamp = now()->timestamp;

            // Generate signature for the receiver's credit
            $receiverSig = $this->generateSignature($lockedReceiverWallet->id, $transfer->amount, $previousReceiverBalance, 'credit', $timestamp);

            // Create the receiver's credit transaction log
            $receiverTx = Transaction::create([
                'wallet_id' => $lockedReceiverWallet->id,
                'amount' => $transfer->amount,
                'type' => 'credit',
                'source' => 'transfer',
                'description' => $transfer->description ?: "Transfer from {$sender->name}",
                'related_user_id' => $sender->id,
                'status' => 'completed',
                'signature' => $receiverSig,
                'created_at' => now(),
            ]);

            // Update sender transaction status to completed
            if ($transfer->sender_transaction_id) {
                $senderTx = Transaction::find($transfer->sender_transaction_id);
                if ($senderTx) {
                    $senderTx->update(['status' => 'completed']);
                }
            }

            // Update the transfer record
            $transfer->update([
                'status' => 'accepted',
                'receiver_transaction_id' => $receiverTx->id,
            ]);

            return $transfer;
        });
    }

    /**
     * Reject a pending transfer: funds refunded to the sender, transaction rejected.
     */
    public function rejectTransfer(\App\Models\Transfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            throw new Exception("This transfer is no longer pending.");
        }

        return DB::transaction(function () use ($transfer) {
            $senderWallet = $transfer->sender->wallet()->firstOrCreate(['currency' => 'AUD']);
            $lockedSenderWallet = Wallet::where('id', $senderWallet->id)->lockForUpdate()->first();

            // Refund sender balance
            $lockedSenderWallet->increment('balance', $transfer->amount);

            // Update sender transaction
            if ($transfer->sender_transaction_id) {
                $tx = Transaction::find($transfer->sender_transaction_id);
                if ($tx) {
                    $tx->update([
                        'status' => 'rejected',
                        'description' => $tx->description . " (Rejected by recipient)",
                    ]);
                }
            }

            $transfer->update([
                'status' => 'rejected',
            ]);

            return $transfer;
        });
    }

    /**
     * Cancel a pending transfer: sender recalls the transfer, funds refunded.
     */
    public function cancelTransfer(\App\Models\Transfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            throw new Exception("This transfer is no longer pending.");
        }

        return DB::transaction(function () use ($transfer) {
            $senderWallet = $transfer->sender->wallet()->firstOrCreate(['currency' => 'AUD']);
            $lockedSenderWallet = Wallet::where('id', $senderWallet->id)->lockForUpdate()->first();

            // Refund sender balance
            $lockedSenderWallet->increment('balance', $transfer->amount);

            // Update sender transaction
            if ($transfer->sender_transaction_id) {
                $tx = Transaction::find($transfer->sender_transaction_id);
                if ($tx) {
                    $tx->update([
                        'status' => 'cancelled',
                        'description' => $tx->description . " (Cancelled by sender)",
                    ]);
                }
            }

            $transfer->update([
                'status' => 'cancelled',
            ]);

            return $transfer;
        });
    }
}

