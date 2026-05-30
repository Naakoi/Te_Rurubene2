<?php

namespace App\Services;

use App\Models\User;
use App\Models\RedeemCode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

class RedeemCodeService
{
    protected $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Generate bulk redeem codes.
     */
    public function generate(User $admin, float $amount, int $quantity = 1, string $specificCode = null, string $description = null)
    {
        $createdCodes = [];

        for ($i = 0; $i < $quantity; $i++) {
            $codeStr = ($quantity === 1 && $specificCode) ? $specificCode : 'RURU-' . strtoupper(Str::random(8));

            $code = RedeemCode::create([
                'code' => $codeStr,
                'amount' => $amount,
                'description' => $description,
                'created_by' => $admin->id,
                'status' => 'active',
            ]);
            $createdCodes[] = $code;
        }

        return $createdCodes;
    }

    /**
     * Redeem a code for a user.
     */
    public function redeem(User $user, string $codeStr)
    {
        $codeStr = strtoupper(trim($codeStr));

        return DB::transaction(function () use ($user, $codeStr) {
            $code = RedeemCode::where('code', $codeStr)->lockForUpdate()->first();

            if (!$code) {
                throw new Exception('Invalid redeem code.');
            }

            if (!$code->isValid()) {
                throw new Exception('This code is invalid, already used, or expired.');
            }

            // Mark as used
            $code->update([
                'status' => 'used',
                'used_by' => $user->id,
                'used_at' => now(),
            ]);

            // Credit wallet using WalletService
            $this->walletService->credit(
                $user,
                $code->amount,
                'redeem',
                'Redeemed code: ' . $code->code,
                'RED_' . $code->id
            );

            return $code;
        });
    }
}
