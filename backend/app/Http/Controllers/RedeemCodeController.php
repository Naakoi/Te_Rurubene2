<?php

namespace App\Http\Controllers;

use App\Models\RedeemCode;
use App\Models\Transaction;
use App\Services\CommerceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\RedeemCodeService;
use Exception;

class RedeemCodeController extends Controller
{
    protected $redeemCodeService;

    public function __construct(RedeemCodeService $redeemCodeService)
    {
        $this->redeemCodeService = $redeemCodeService;
    }

    // Admin: List all codes
    public function index()
    {
        $codes = RedeemCode::with(['creator', 'user'])->latest()->get();
        return response()->json(['codes' => $codes]);
    }

    // Admin: Create new code(s)
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'code' => 'nullable|string|unique:redeem_codes',
            'description' => 'nullable|string',
            'quantity' => 'nullable|integer|min:1|max:50',
        ]);

        $quantity = $request->quantity ?: 1;

        $createdCodes = $this->redeemCodeService->generate(
            $request->user(), 
            $request->amount, 
            $quantity, 
            $request->code, 
            $request->description
        );

        return response()->json([
            'codes' => $createdCodes, 
            'message' => $quantity > 1 ? "$quantity codes created successfully" : 'Code created successfully'
        ]);
    }

    // Admin: Delete/Revoke a code
    public function destroy($id)
    {
        $code = RedeemCode::findOrFail($id);
        
        if ($code->status === 'used') {
            return response()->json(['message' => 'Cannot delete a used code'], 400);
        }

        $code->delete();
        return response()->json(['message' => 'Code deleted successfully']);
    }

    // User: Redeem a code
    public function redeem(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        try {
            $code = $this->redeemCodeService->redeem($request->user(), $request->code);

            return response()->json([
                'message' => 'Code redeemed successfully! $' . $code->amount . ' AUD added to your wallet.',
                'amount' => $code->amount,
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
