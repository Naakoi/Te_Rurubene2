<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Artist;
use App\Models\User;
use App\Models\RadioStation;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;

class AdminController extends Controller
{
    /**
     * Reset a user's password.
     */
    public function resetUserPassword(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string|min:8'
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json(['message' => 'Password reset successfully']);
    }

    /**
     * List all users for management.
     */
    public function listUsers()
    {
        return response()->json(User::latest()->get());
    }

    /**
     * Delete a user.
     */
    public function deleteUser($id)
    {
        User::findOrFail($id)->delete();
        return response()->json(['message' => 'User deleted']);
    }

    /**
     * List all radio stations for management.
     */
    public function listStations()
    {
        return response()->json(RadioStation::latest()->get());
    }

    /**
     * Add a new radio station.
     */
    public function addStation(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'stream_url' => 'required|url',
            'genre' => 'nullable|string'
        ]);

        $station = RadioStation::create($request->all());

        return response()->json($station, 201);
    }

    /**
     * Delete a radio station.
     */
    public function deleteStation($id)
    {
        RadioStation::findOrFail($id)->delete();
        return response()->json(['message' => 'Station deleted']);
    }

    /**
     * List all artists for moderation.
     */
    public function listArtists()
    {
        return response()->json(Artist::with('user')->latest()->get());
    }

    /**
     * Approve or decline an artist verification.
     */
    public function verifyArtist(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:approved,declined,pending'
        ]);

        $artist = Artist::findOrFail($id);
        $artist->update(['verification_status' => $request->status]);

        return response()->json(['message' => 'Artist status updated', 'artist' => $artist]);
    }

    /**
     * Get platform-wide analytics for admin.
     */
    public function platformStats()
    {
        return response()->json([
            'total_users' => User::count(),
            'total_artists' => Artist::count(),
            'revenue' => 8450.00, // Placeholder
            'pending_verifications' => Artist::where('verification_status', 'pending')->count()
        ]);
    }

    /**
     * Retrieve platform settings.
     */
    public function getSettings()
    {
        return response()->json([
            'wallet_testing_mode' => Cache::get('wallet_testing_mode', true)
        ]);
    }

    /**
     * Update/toggle platform settings.
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'wallet_testing_mode' => 'required|boolean'
        ]);

        Cache::forever('wallet_testing_mode', (bool) $request->wallet_testing_mode);

        return response()->json([
            'message' => 'Settings updated successfully',
            'wallet_testing_mode' => Cache::get('wallet_testing_mode')
        ]);
    }
}
