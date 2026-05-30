<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LiveEvent;
use App\Models\ChatMessage;

class LiveEventController extends Controller
{
    /**
     * Schedule a new live event (Studio/Artist only)
     */
    public function schedule(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'scheduled_at' => 'required|date|after:now',
            'is_premium' => 'boolean'
        ]);

        // Generate a random RTMP stream key
        $streamKey = 'live_' . bin2hex(random_bytes(16));

        $event = LiveEvent::create([
            'artist_id' => $request->user()->artist->id, // Assuming artist relation exists
            'title' => $request->title,
            'stream_key' => $streamKey,
            'is_premium' => $request->is_premium ?? false,
            'scheduled_at' => $request->scheduled_at,
            'status' => 'scheduled'
        ]);

        return response()->json($event, 201);
    }

    /**
     * Send a chat message (optionally with a tip)
     */
    public function sendChat(Request $request, $eventId)
    {
        $request->validate([
            'message' => 'required|string|max:500',
            'tip_amount' => 'nullable|numeric|min:1'
        ]);

        $event = LiveEvent::findOrFail($eventId);
        $user = $request->user();

        // Handle Tipping logic if tip_amount is present
        if ($request->filled('tip_amount')) {
            $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);
            if ($wallet->balance < $request->tip_amount) {
                return response()->json(['message' => 'Insufficient wallet balance for tip'], 402);
            }
            
            \DB::transaction(function () use ($wallet, $request, $event) {
                $wallet->decrement('balance', $request->tip_amount);
                
                // Credit artist wallet
                $artistWallet = $event->artist->user->wallet()->firstOrCreate(['currency' => 'AUD']);
                $artistWallet->increment('balance', $request->tip_amount);
            });
        }

        $chat = ChatMessage::create([
            'live_event_id' => $event->id,
            'user_id' => $user->id,
            'message' => $request->message,
            'is_tip' => $request->filled('tip_amount'),
            'tip_amount' => $request->tip_amount
        ]);

        // Dispatch a Laravel Echo / Pusher event here to broadcast to active viewers
        // broadcast(new NewChatMessage($chat))->toOthers();

        return response()->json($chat);
    }
}
