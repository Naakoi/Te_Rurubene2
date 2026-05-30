<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Profile;
use App\Models\Artist;
use App\Models\Invitation;
use App\Models\RevenueSplit;
use App\Models\Studio;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreatorOnboardingController extends Controller
{
    /**
     * Step 1: Register new user (Simulated OTP)
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'country' => 'required|string',
            'island' => 'required|string',
        ]);

        // In production, we'd send an OTP here and verify it in a separate step.
        // For now, we simulate success and create the user directly.

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'client', // Starts as client, upgraded later
                'email_verified_at' => now(), // Simulated OTP success
            ]);

            Profile::create([
                'user_id' => $user->id,
                'country' => $request->country,
                'island' => $request->island,
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;
            DB::commit();

            return response()->json([
                'message' => 'Account created and verified successfully.',
                'token' => $token,
                'user' => $user->load('profile')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Registration Error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create account.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Step 3A: Setup Independent Artist
     */
    public function setupIndependent(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'artist_name' => 'required|string|max:255',
            'bio' => 'nullable|string',
        ]);

        if ($user->artist) {
            return response()->json(['message' => 'User is already an artist.'], 400);
        }

        DB::beginTransaction();
        try {
            $user->update(['role' => 'artist']);

            $artist = Artist::create([
                'user_id' => $user->id,
                'name' => $request->artist_name,
                'bio' => $request->bio,
                'verification_status' => 'pending',
                'studio_id' => null, // Independent
            ]);

            // Create 100% revenue split for independent artist
            RevenueSplit::create([
                'artist_id' => $artist->id,
                'studio_id' => null,
                'artist_percentage' => 100.00,
                'studio_percentage' => 0.00,
            ]);

            // Create earnings wallet
            $user->wallet()->firstOrCreate(['currency' => 'AUD']);

            DB::commit();

            return response()->json([
                'message' => 'Independent artist setup complete.',
                'artist' => $artist,
                'user' => $user->fresh()->load('profile')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to setup independent artist.'], 500);
        }
    }

    /**
     * Step 3B: Setup Studio-Managed Artist
     */
    public function setupStudioManaged(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'artist_name' => 'required|string|max:255',
            'invitation_code' => 'required|string|exists:invitations,code',
        ]);

        if ($user->artist) {
            return response()->json(['message' => 'User is already an artist.'], 400);
        }

        $invitation = Invitation::where('code', $request->invitation_code)
            ->where('is_used', false)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })->first();

        if (!$invitation) {
            return response()->json(['message' => 'Invalid or expired invitation code.'], 400);
        }

        DB::beginTransaction();
        try {
            $user->update(['role' => 'artist']);

            $artist = Artist::create([
                'user_id' => $user->id,
                'studio_id' => $invitation->studio_id,
                'name' => $request->artist_name,
                'verification_status' => 'pending',
            ]);

            $studioPercentage = $invitation->default_revenue_split;
            $artistPercentage = 100 - $studioPercentage;

            RevenueSplit::create([
                'artist_id' => $artist->id,
                'studio_id' => $invitation->studio_id,
                'artist_percentage' => $artistPercentage,
                'studio_percentage' => $studioPercentage,
            ]);

            $invitation->update(['is_used' => true]);

            $user->wallet()->firstOrCreate(['currency' => 'AUD']);

            DB::commit();

            return response()->json([
                'message' => 'Studio-managed artist setup complete.',
                'artist' => $artist,
                'split' => "Artist: {$artistPercentage}%, Studio: {$studioPercentage}%",
                'user' => $user->fresh()->load('profile')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to setup studio-managed artist.'], 500);
        }
    }

    /**
     * Generate an invitation code (For Studio Managers)
     */
    public function generateInvitation(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'studio') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $studio = Studio::where('user_id', $user->id)->first();
        if (!$studio) {
            return response()->json(['message' => 'Studio not found.'], 404);
        }

        $request->validate([
            'default_revenue_split' => 'required|numeric|min:0|max:100', // This is the studio's cut
        ]);

        $code = strtoupper(Str::random(8));

        $invitation = Invitation::create([
            'studio_id' => $studio->id,
            'code' => $code,
            'default_revenue_split' => $request->default_revenue_split,
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json([
            'message' => 'Invitation code generated.',
            'invitation' => $invitation
        ]);
    }
}
