<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
use App\Models\Stream;
use App\Models\RevenueStatement;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CalculateMonthlyRoyalties implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $month;

    /**
     * Create a new job instance.
     * @param string|null $month 'YYYY-MM'
     */
    public function __construct($month = null)
    {
        $this->month = $month ?? Carbon::now()->subMonth()->format('Y-m');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $startDate = Carbon::createFromFormat('Y-m', $this->month)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // 1. Calculate total premium streams (Global Aggregation)
        $totalPlatformStreams = Stream::whereBetween('created_at', [$startDate, $endDate])->count();
        
        if ($totalPlatformStreams === 0) return;

        // 2. Define pool and calculate per-stream rate
        $subscriptionPool = 10000; // Mock $10k pool
        $perStreamRate = ($subscriptionPool * 0.70) / $totalPlatformStreams;
        $adminCommissionRate = 0.15; // 15% platform cut

        // 3. Get Stream Stats for all artists in a SINGLE query
        $artistStats = Stream::join('tracks', 'streams.track_id', '=', 'tracks.id')
            ->join('artists', 'tracks.artist_id', '=', 'artists.id')
            ->select('artists.user_id', DB::raw('count(*) as stream_count'))
            ->whereBetween('streams.created_at', [$startDate, $endDate])
            ->groupBy('artists.user_id')
            ->get();

        $commerceService = app(\App\Services\CommerceService::class);

        foreach ($artistStats as $stat) {
            // Avoid double-payouts
            if (RevenueStatement::where('user_id', $stat->user_id)->where('month', $this->month)->exists()) {
                continue;
            }

            $artistStreams = $stat->stream_count;
            $grossRevenue = $artistStreams * $perStreamRate;
            $adminCommission = $grossRevenue * $adminCommissionRate;
            $netEarnings = $grossRevenue - $adminCommission;

            DB::transaction(function () use ($stat, $artistStreams, $grossRevenue, $adminCommission, $netEarnings, $commerceService) {
                $user = User::find($stat->user_id);
                if (!$user) return;

                // Generate Statement
                $statement = RevenueStatement::create([
                    'user_id' => $user->id,
                    'month' => $this->month,
                    'total_streams' => $artistStreams,
                    'total_revenue' => $grossRevenue,
                    'admin_commission' => $adminCommission,
                    'net_earnings' => $netEarnings,
                    'status' => 'paid',
                ]);

                // Credit Wallet using unified service
                $commerceService->creditFunds(
                    $user,
                    $netEarnings,
                    'royalty',
                    "Royalty payout for " . $this->month,
                    $statement->id
                );
            });
        }
    }
}
