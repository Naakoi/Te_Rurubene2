<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Stream;
use App\Models\RevenueStatement;

class AnalyticsController extends Controller
{
    /**
     * Get artist analytics dashboard data
     */
    public function artistDashboard(Request $request)
    {
        $user = $request->user();
        
        // Ensure user is an artist
        if ($user->role !== 'artist') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $totalStreams = Stream::whereHas('track', function($q) use ($user) {
            $q->where('artist_id', $user->artist->id ?? 0);
        })->count();

        $statements = RevenueStatement::where('user_id', $user->id)->latest()->take(12)->get();
        $totalEarnings = $statements->sum('net_earnings');

        return response()->json([
            'total_streams' => $totalStreams,
            'total_earnings' => $totalEarnings,
            'revenue_history' => $statements
        ]);
    }
}
