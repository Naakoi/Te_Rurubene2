<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Track;
use App\Models\Event;
use App\Models\Ticket;
use App\Models\PurchasedTrack;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

class CommerceService
{
    /**
     * Core method to transfer funds between users safely.
     * Includes row-level locking to prevent double-spending.
     */
    public function transferFunds(User $sender, User $receiver, float $amount, string $source, string $description, string $referenceId = null)
    {
        return DB::transaction(function () use ($sender, $receiver, $amount, $source, $description, $referenceId) {
            // 1. Get and Lock Sender Wallet
            $senderWallet = $sender->wallet()->firstOrCreate(['currency' => 'AUD']);
            $senderWallet = Wallet::where('id', $senderWallet->id)->lockForUpdate()->first();

            if ($senderWallet->balance < $amount) {
                throw new Exception("Insufficient wallet balance.");
            }

            // 2. Deduct from Sender
            $senderWallet->decrement('balance', $amount);

            Transaction::create([
                'wallet_id' => $senderWallet->id,
                'amount' => -$amount,
                'type' => 'debit',
                'source' => $source,
                'description' => $description,
                'related_user_id' => $receiver->id,
                'reference_id' => $referenceId,
                'status' => 'completed'
            ]);

            // 3. Credit the Receiver
            $receiverWallet = $receiver->wallet()->firstOrCreate(['currency' => 'AUD']);
            $receiverWallet->increment('balance', $amount);

            Transaction::create([
                'wallet_id' => $receiverWallet->id,
                'amount' => $amount,
                'type' => 'credit',
                'source' => $source === 'purchase' ? 'royalty' : $source, // Purchases become royalties for creators
                'description' => $description,
                'related_user_id' => $sender->id,
                'reference_id' => $referenceId,
                'status' => 'completed'
            ]);

            return true;
        });
    }

    /**
     * Purchase a specific music track.
     */
    public function purchaseTrack(User $user, Track $track)
    {
        if (PurchasedTrack::where('user_id', $user->id)->where('track_id', $track->id)->exists()) {
            throw new Exception("Track already purchased.");
        }

        $artistUser = $track->artist->user;
        $price = $track->price;

        return DB::transaction(function () use ($user, $track, $artistUser, $price) {
            $this->transferFunds(
                $user, 
                $artistUser, 
                $price, 
                'purchase', 
                "Purchased track: {$track->title}"
            );

            return PurchasedTrack::create([
                'user_id' => $user->id,
                'track_id' => $track->id,
                'price' => $price
            ]);
        });
    }

    /**
     * Purchase a ticket for an event.
     */
    public function purchaseTicket(User $user, Event $event)
    {
        $artistUser = $event->artist->user;
        $price = $event->ticket_price;

        return DB::transaction(function () use ($user, $event, $artistUser, $price) {
            // Transfer funds
            $this->transferFunds(
                $user, 
                $artistUser, 
                $price, 
                'purchase', 
                "Ticket for event: {$event->title}"
            );

            // Generate unique ticket hash
            $ticketHash = hash('sha256', Str::random(40) . $user->id . $event->id . time());
            $qrPayload = "TKT-{$event->id}-{$user->id}-" . substr($ticketHash, 0, 8);

            return Ticket::create([
                'event_id' => $event->id,
                'user_id' => $user->id,
                'qr_code' => $qrPayload,
                'status' => 'valid'
            ]);
        });
    }

    /**
     * Process a full cart checkout.
     */
    public function processCheckout(User $user, array $items, float $total, string $shippingAddress = null)
    {
        return DB::transaction(function () use ($user, $items, $total, $shippingAddress) {
            // 1. Create the Main Order
            $order = Order::create([
                'user_id' => $user->id,
                'total_amount' => $total,
                'shipping_address' => $shippingAddress ?? 'Digital Delivery',
                'status' => 'completed'
            ]);

            // 2. Process each item (Transfer funds and create order items)
            foreach ($items as $item) {
                $itemType = $item['type'];
                $itemId = $item['id'];
                $itemPrice = $item['price'] * ($item['quantity'] ?? 1);
                $creatorUser = null;

                if ($itemType === 'track') {
                    $track = Track::findOrFail($itemId);
                    $creatorUser = $track->artist->user;
                    
                    // Grant ownership
                    PurchasedTrack::firstOrCreate([
                        'user_id' => $user->id,
                        'track_id' => $track->id
                    ], ['price' => $item['price']]);

                } else if ($itemType === 'product') {
                    $product = Product::findOrFail($itemId);
                    $creatorUser = ($product->artist ?? $product->studio)->user;
                }

                if ($creatorUser) {
                    $this->transferFunds(
                        $user, 
                        $creatorUser, 
                        $itemPrice, 
                        'purchase', 
                        "Order Item: " . ($item['name'] ?? $itemType),
                        $order->id
                    );
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemType === 'product' ? $itemId : null,
                    'item_name' => $item['name'] ?? 'Item',
                    'item_type' => $itemType,
                    'quantity' => $item['quantity'] ?? 1,
                    'price' => $item['price']
                ]);
            }

            return $order;
        });
    }

    /**
     * Credit funds to a user's wallet directly.
     */
    public function creditFunds(User $user, float $amount, string $source, string $description, $referenceId = null)
    {
        return DB::transaction(function () use ($user, $amount, $source, $description, $referenceId) {
            $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();
            $wallet->increment('balance', $amount);

            // Prevent duplicate transaction records for top-ups (which already created one as pending)
            $exists = false;
            if ($source === 'stripe' || $source === 'paypal') {
                if (is_numeric($referenceId)) {
                    $exists = Transaction::where('id', $referenceId)->exists();
                } else if ($referenceId) {
                    $exists = Transaction::where('reference_id', $referenceId)->exists();
                }
            }

            if (!$exists) {
                Transaction::create([
                    'wallet_id' => $wallet->id,
                    'amount' => $amount,
                    'type' => 'credit',
                    'source' => $source,
                    'description' => $description,
                    'reference_id' => is_numeric($referenceId) ? null : $referenceId,
                    'status' => 'completed'
                ]);
            }

            // Notify the user of the successful top-up
            $sourceLabel = match ($source) {
                'stripe'    => 'Visa/Mastercard (Stripe)',
                'paypal'    => 'PayPal',
                'bank_deposit' => 'Bank Deposit',
                default     => ucfirst($source),
            };

            $user->notifications()->create([
                'type'    => 'transaction',
                'title'   => 'Wallet Top-up Successful',
                'message' => 'Your wallet has been credited with $' . number_format($amount, 2) . ' AUD via ' . $sourceLabel . '. Your new balance is ready to use.',
            ]);

            return true;
        });
    }
}
