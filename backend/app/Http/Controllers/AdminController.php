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
        return response()->json(User::with('wallet')->latest()->get());
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
        $totalCreditsIn = \App\Models\Transaction::where('type', 'credit')->sum('amount');

        return response()->json([
            'total_users'            => \App\Models\User::count(),
            'total_artists'          => \App\Models\Artist::count(),
            'revenue'                => round($totalCreditsIn, 2),
            'pending_verifications'  => \App\Models\Artist::where('verification_status', 'pending')->count(),
        ]);
    }

    /**
     * System-wide financial ledger — totals, role balances, revenue by source, per-user balances.
     */
    public function systemLedger()
    {
        // 1. Total balance currently held in all wallets
        $systemTotalBalance = \Illuminate\Support\Facades\DB::table('wallets')->sum('balance');

        // 2. All-time totals from the transactions ledger
        $totalCreditsIn  = \App\Models\Transaction::where('type', 'credit')->sum('amount');
        $totalDebitsOut  = \App\Models\Transaction::where('type', 'debit')->sum(\Illuminate\Support\Facades\DB::raw('ABS(amount)'));
        $withdrawalsOut  = \App\Models\Transaction::where('type', 'debit')->where('source', 'withdrawal')->sum(\Illuminate\Support\Facades\DB::raw('ABS(amount)'));

        // 3. Pending outflows (approved withdrawals awaiting user confirmation — money still in wallets)
        $pendingOutflows = \App\Models\Withdrawal::whereIn('status', ['pending', 'approved'])->sum('amount');

        // 4. Balance grouped by user role (summary row + individual users)
        $roles = \Illuminate\Support\Facades\DB::table('wallets')
            ->join('users', 'wallets.user_id', '=', 'users.id')
            ->select('users.role', \Illuminate\Support\Facades\DB::raw('SUM(wallets.balance) as total_balance'), \Illuminate\Support\Facades\DB::raw('COUNT(*) as user_count'))
            ->groupBy('users.role')
            ->orderByDesc('total_balance')
            ->get();

        // 5. Per-user balances (for individual drill-down in each role group)
        $userBalances = \Illuminate\Support\Facades\DB::table('wallets')
            ->join('users', 'wallets.user_id', '=', 'users.id')
            ->select('users.id', 'users.name', 'users.email', 'users.role', 'wallets.balance', 'wallets.currency')
            ->orderBy('users.role')
            ->orderByDesc('wallets.balance')
            ->get()
            ->groupBy('role');

        // 6. Revenue by source (all credit transactions grouped by source)
        $revenueBySource = \App\Models\Transaction::where('type', 'credit')
            ->select('source', \Illuminate\Support\Facades\DB::raw('SUM(amount) as total'), \Illuminate\Support\Facades\DB::raw('COUNT(*) as count'))
            ->groupBy('source')
            ->orderByDesc('total')
            ->get();

        // 7. Platform revenue — 10% fee collected from all purchases (from creator_earnings)
        $platformRevenue = \App\Models\CreatorEarning::where('recipient_type', 'platform')
            ->whereIn('status', ['available', 'pending'])
            ->sum('amount');

        // 8. Platform revenue broken down by purchase count and total (grouped by month for trend)
        $platformRevenueByMonth = \Illuminate\Support\Facades\DB::table('creator_earnings')
            ->where('recipient_type', 'platform')
            ->whereIn('status', ['available', 'pending'])
            ->select(
                \Illuminate\Support\Facades\DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                \Illuminate\Support\Facades\DB::raw('SUM(amount) as total'),
                \Illuminate\Support\Facades\DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderByDesc('month')
            ->limit(6)
            ->get();

        return response()->json([
            'system_total_balance' => round($systemTotalBalance, 2),
            'total_credits_in'     => round($totalCreditsIn, 2),
            'total_debits_out'     => round($totalDebitsOut, 2),
            'withdrawals_out'      => round($withdrawalsOut, 2),
            'pending_outflows'     => round($pendingOutflows, 2),
            'net_position'         => round($totalCreditsIn - $totalDebitsOut, 2),
            'balance_by_role'      => $roles,
            'users_by_role'        => $userBalances,
            'revenue_by_source'    => $revenueBySource,
            'platform_revenue'     => round($platformRevenue, 2),
            'platform_revenue_by_month' => $platformRevenueByMonth,
        ]);
    }

    /**
     * Paginated platform revenue transactions (10% fee rows from creator_earnings).
     * Joins purchase → purchased_content → content (track/album) → artist/studio → user
     * to show: buyer, content title, creator, sale price, platform cut.
     */
    public function revenueTransactions(\Illuminate\Http\Request $request)
    {
        $perPage = 25;
        $search  = $request->query('search', '');

        // Base query: all platform-fee earnings rows
        $query = \Illuminate\Support\Facades\DB::table('creator_earnings as ce')
            ->where('ce.recipient_type', 'platform')
            // Join to the parent purchase (gives us buyer user_id + total_amount)
            ->join('purchases as p', 'p.id', '=', 'ce.purchase_id')
            ->join('users as buyer', 'buyer.id', '=', 'p.user_id')
            // Join to the first purchased_content row for this purchase (one item per purchase in most cases)
            ->leftJoin('purchased_contents as pc', 'pc.purchase_id', '=', 'ce.purchase_id')
            // Try to resolve track title + artist
            ->leftJoin('tracks as t', function ($j) {
                $j->on('t.id', '=', 'pc.content_id')
                  ->whereRaw("pc.content_type IN ('song','track')");
            })
            ->leftJoin('artists as ta', 'ta.id', '=', 't.artist_id')
            ->leftJoin('users as artist_user', 'artist_user.id', '=', 'ta.user_id')
            // Album fallback
            ->leftJoin('albums as al', function ($j) {
                $j->on('al.id', '=', 'pc.content_id')
                  ->whereRaw("pc.content_type = 'album'");
            })
            ->leftJoin('artists as ala', 'ala.id', '=', 'al.artist_id')
            ->leftJoin('users as album_artist_user', 'album_artist_user.id', '=', 'ala.user_id')
            ->select([
                'ce.id',
                'ce.purchase_id',
                'ce.amount as platform_cut',
                'ce.status',
                'ce.created_at',
                'p.total_amount as sale_amount',
                'buyer.name as buyer_name',
                'buyer.email as buyer_email',
                'pc.content_type',
                // Content title: track title or album title
                \Illuminate\Support\Facades\DB::raw("COALESCE(t.title, al.title, 'Unknown') as content_title"),
                // Creator name: track artist or album artist
                \Illuminate\Support\Facades\DB::raw("COALESCE(artist_user.name, album_artist_user.name, 'Unknown') as creator_name"),
                \Illuminate\Support\Facades\DB::raw("COALESCE(artist_user.email, album_artist_user.email, NULL) as creator_email"),
            ])
            ->orderByDesc('ce.created_at');

        // Optional search filter (buyer name/email or creator name)
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('buyer.name', 'like', "%{$search}%")
                  ->orWhere('buyer.email', 'like', "%{$search}%")
                  ->orWhere('artist_user.name', 'like', "%{$search}%")
                  ->orWhere('album_artist_user.name', 'like', "%{$search}%")
                  ->orWhere('t.title', 'like', "%{$search}%")
                  ->orWhere('al.title', 'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate($perPage);

        return response()->json($paginated);
    }

    /**
     * Paginated system-wide transaction log with user details.
     */
    public function systemTransactions(\Illuminate\Http\Request $request)
    {
        $type       = $request->query('type');        // 'credit' | 'debit'
        $source     = $request->query('source');      // 'bank_deposit', 'withdrawal', etc.
        $userSearch = $request->query('user_search'); // name or email substring
        $sortBy     = $request->query('sort_by', 'created_at'); // column to sort
        $sortDir    = $request->query('sort_dir', 'desc');       // 'asc' | 'desc'

        // Whitelist sortable columns to prevent SQL injection
        $allowedSorts = ['created_at', 'amount', 'type', 'source'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        $query = \App\Models\Transaction::with(['wallet' => function ($q) {
            $q->select('id', 'user_id', 'currency')->with('user:id,name,email,role');
        }]);

        if ($type)   $query->where('type', $type);
        if ($source) $query->where('source', $source);

        // Filter by user name or email via wallet→user join
        if ($userSearch) {
            $query->whereHas('wallet.user', function ($q) use ($userSearch) {
                $q->where('name', 'like', "%{$userSearch}%")
                  ->orWhere('email', 'like', "%{$userSearch}%");
            });
        }

        $query->orderBy($sortBy, $sortDir);

        $paginated = $query->paginate(50);

        return response()->json($paginated);
    }

    /**
     * Retrieve platform settings.
     */
    public function getSettings()
    {
        return response()->json([
            'wallet_testing_mode' => Cache::get('wallet_testing_mode', true),
            'platform_fee_pct'    => (float) Cache::get('platform_fee_pct', 10),
        ]);
    }

    /**
     * Update/toggle platform settings.
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'wallet_testing_mode' => 'sometimes|boolean',
            'platform_fee_pct'    => 'sometimes|numeric|min:5|max:30',
        ]);

        if ($request->has('wallet_testing_mode')) {
            Cache::forever('wallet_testing_mode', (bool) $request->wallet_testing_mode);
        }

        if ($request->has('platform_fee_pct')) {
            $oldFee = (float) Cache::get('platform_fee_pct', 10);
            $newFee = (float) $request->platform_fee_pct;

            Cache::forever('platform_fee_pct', $newFee);

            // Notify all artists and studio users about the fee change
            if ((int) $oldFee !== (int) $newFee) {
                $creatorRoles = ['artist', 'studio'];
                $creators = \App\Models\User::whereIn('role', $creatorRoles)->get();

                foreach ($creators as $creator) {
                    $creator->notifications()->create([
                        'type'    => 'platform_fee_change',
                        'title'   => '📢 Platform Fee Updated',
                        'message' => "The platform service fee has been updated from {$oldFee}% to {$newFee}%. "
                            . "This applies to all new purchases going forward. "
                            . "Your existing earnings are not affected.",
                        'data'    => [
                            'old_fee' => $oldFee,
                            'new_fee' => $newFee,
                        ],
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'wallet_testing_mode' => Cache::get('wallet_testing_mode')
        ]);
    }

    /**
     * Get a user's wallet transactions.
     */
    public function userTransactions($id)
    {
        $user = User::findOrFail($id);
        $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);
        $transactions = $wallet->transactions()->with('relatedUser')->latest()->get();

        return response()->json([
            'balance' => $wallet->balance,
            'currency' => $wallet->currency,
            'transactions' => $transactions
        ]);
    }

    // ──────────────────────────────────────────────
    //  BANK DEPOSIT (ANZ Kiribati Internet Banking)
    // ──────────────────────────────────────────────

    /**
     * List all bank deposit submissions (admin view).
     */
    public function listBankDeposits(Request $request)
    {
        $status = $request->query('status'); // optional ?status=pending
        $query = \App\Models\BankDeposit::with('user:id,name,email')->latest();
        if ($status) {
            $query->where('status', $status);
        }
        return response()->json($query->get());
    }

    /**
     * Approve a pending bank deposit — credit the user's wallet.
     */
    public function approveBankDeposit(Request $request, $id)
    {
        $deposit = \App\Models\BankDeposit::findOrFail($id);

        if ($deposit->status !== 'pending') {
            return response()->json(['message' => 'This deposit has already been processed.'], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($deposit, $request) {
            // Credit wallet
            $wallet = $deposit->user->wallet()->firstOrCreate(['currency' => 'AUD']);
            $wallet->increment('balance', $deposit->amount);

            // Record transaction
            $wallet->transactions()->create([
                'type'        => 'credit',
                'amount'      => $deposit->amount,
                'source'      => 'bank_deposit',
                'description' => 'ANZ Kiribati Bank Deposit (Approved)',
                'status'      => 'completed',
            ]);

            // Mark deposit approved
            $deposit->update([
                'status'      => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
                'admin_note'  => $request->input('note'),
            ]);

            // Create Notification
            $deposit->user->notifications()->create([
                'type' => 'transaction',
                'title' => 'Bank Deposit Approved',
                'message' => 'Your bank deposit of $' . number_format($deposit->amount, 2) . ' AUD has been approved and credited to your wallet.',
            ]);
        });

        return response()->json(['message' => 'Deposit approved and wallet credited.', 'deposit' => $deposit->fresh()]);
    }

    /**
     * Reject a pending bank deposit with an admin note.
     */
    public function rejectBankDeposit(Request $request, $id)
    {
        $request->validate(['note' => 'nullable|string|max:500']);

        $deposit = \App\Models\BankDeposit::findOrFail($id);

        if ($deposit->status !== 'pending') {
            return response()->json(['message' => 'This deposit has already been processed.'], 422);
        }

        $deposit->update([
            'status'      => 'rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'admin_note'  => $request->input('note', 'Receipt did not match transfer records.'),
        ]);

        $deposit->user->notifications()->create([
            'type' => 'transaction',
            'title' => 'Bank Deposit Rejected',
            'message' => 'Your bank deposit of $' . number_format($deposit->amount, 2) . ' AUD was rejected. Reason: ' . $deposit->admin_note,
        ]);

        return response()->json(['message' => 'Deposit rejected.', 'deposit' => $deposit->fresh()]);
    }

    /**
     * Adjust or top up a user's wallet balance manually.
     */
    public function adjustUserWallet(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01|max:100000',
            'type'   => 'required|string|in:credit,debit',
            'note'   => 'nullable|string|max:255',
        ]);

        $user = User::findOrFail($id);
        $wallet = $user->wallet()->firstOrCreate(['currency' => 'AUD']);
        
        $amount = abs($request->input('amount'));
        $type = $request->input('type');
        $note = $request->input('note') ?: 'Manual admin adjustment';

        \Illuminate\Support\Facades\DB::transaction(function () use ($wallet, $amount, $type, $note) {
            if ($type === 'credit') {
                $wallet->increment('balance', $amount);
            } else {
                $wallet->decrement('balance', min($wallet->balance, $amount));
            }

            $wallet->transactions()->create([
                'type'        => $type,
                'amount'      => $amount,
                'source'      => 'bank_deposit',
                'description' => 'Admin Adjustment: ' . $note,
                'status'      => 'completed',
            ]);

            $wallet->user->notifications()->create([
                'type' => 'transaction',
                'title' => 'Wallet Balance Adjusted',
                'message' => 'Your wallet balance has been ' . ($type === 'credit' ? 'credited' : 'debited') . ' by $' . number_format($amount, 2) . ' AUD. Note: ' . $note,
            ]);
        });

        return response()->json([
            'message' => 'Wallet balance updated successfully.',
            'wallet'  => $wallet->fresh(),
        ]);
    }
}

