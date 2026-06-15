<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class WalletPinController extends Controller
{
    /**
     * Check if the authenticated user has set their wallet PIN.
     */
    public function status(Request $request)
    {
        return response()->json([
            'has_pin' => !is_null($request->user()->wallet_pin),
        ]);
    }

    /**
     * Verify the PIN before allowing access.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'pin' => 'required|string|size:4|regex:/^[0-9]+$/',
        ]);

        $user = $request->user();

        if (is_null($user->wallet_pin)) {
            return response()->json(['message' => 'Wallet PIN not set.'], 403);
        }

        if (!Hash::check($request->pin, $user->wallet_pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        return response()->json(['message' => 'PIN verified.']);
    }

    /**
     * Allow existing users without a PIN to set one.
     */
    public function setPin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string|size:4|regex:/^[0-9]+$/',
        ]);

        $user = $request->user();

        if (!is_null($user->wallet_pin)) {
            return response()->json(['message' => 'Wallet PIN is already set. Use the forgot flow to change it.'], 422);
        }

        $user->update([
            'wallet_pin' => Hash::make($request->pin),
        ]);

        return response()->json(['message' => 'Wallet PIN set successfully.']);
    }

    /**
     * Generate an OTP to reset the PIN and send via email.
     */
    public function forgotPin(Request $request)
    {
        $user = $request->user();

        if (is_null($user->wallet_pin)) {
            return response()->json(['message' => 'You do not have a wallet PIN set yet.'], 422);
        }

        // Generate 6-digit OTP
        $otp = sprintf("%06d", mt_rand(1, 999999));
        
        // Cache OTP for 15 minutes
        Cache::put('wallet_pin_reset_' . $user->id, $otp, now()->addMinutes(15));

        // Attempt to send email (or just log it if Mail is not configured)
        try {
            Mail::raw("Your Rurubene2 Wallet PIN Reset Code is: {$otp}\n\nThis code expires in 15 minutes.", function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Wallet PIN Reset Code');
            });
            Log::info("Wallet PIN reset OTP sent to {$user->email}");
        } catch (\Exception $e) {
            // Fallback for local testing if SMTP isn't configured
            Log::warning("Could not send email. Wallet PIN reset OTP for {$user->email} is: {$otp}");
        }

        return response()->json(['message' => 'OTP sent to your email. Please check your inbox.']);
    }

    /**
     * Verify the OTP and save the new PIN.
     */
    public function resetPin(Request $request)
    {
        $request->validate([
            'otp' => 'required|string|size:6',
            'new_pin' => 'required|string|size:4|regex:/^[0-9]+$/',
        ]);

        $user = $request->user();
        $cachedOtp = Cache::get('wallet_pin_reset_' . $user->id);

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        // Reset the PIN
        $user->update([
            'wallet_pin' => Hash::make($request->new_pin),
        ]);

        // Clear the OTP
        Cache::forget('wallet_pin_reset_' . $user->id);

        return response()->json(['message' => 'Wallet PIN reset successfully.']);
    }
}
