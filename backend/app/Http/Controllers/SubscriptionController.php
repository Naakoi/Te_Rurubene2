<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Plan;
use App\Models\Subscription;
use Carbon\Carbon;

class SubscriptionController extends Controller
{
    /**
     * List available plans.
     */
    public function plans()
    {
        return response()->json(Plan::where('is_active', true)->get());
    }

    /**
     * Subscribe user to a plan using wallet balance.
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id'
        ]);

        $plan = Plan::findOrFail($request->plan_id);
        $user = $request->user();
        $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);

        if ($wallet->balance < $plan->price) {
            return response()->json(['message' => 'Insufficient wallet balance.'], 402);
        }

        \DB::transaction(function () use ($user, $wallet, $plan) {
            // Deduct balance
            $wallet->decrement('balance', $plan->price);

            // Log Transaction
            $wallet->transactions()->create([
                'amount' => $plan->price,
                'type' => 'debit',
                'source' => 'subscription',
                'description' => "Subscribed to {$plan->name} plan"
            ]);

            // Create/Update Subscription
            $expiresAt = $plan->interval === 'yearly' ? Carbon::now()->addYear() : Carbon::now()->addMonth();
            
            Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'expires_at' => $expiresAt
                ]
            );
        });

        return response()->json(['message' => "Successfully subscribed to {$plan->name}"]);
    }
}
