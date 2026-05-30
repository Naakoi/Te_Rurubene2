<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('method'); // 'bank', 'mpaisa', 'paypal'
            $table->string('status')->default('pending'); // 'pending', 'approved', 'processed', 'rejected'
            $table->text('admin_notes')->nullable();
            $table->text('payout_details')->nullable(); // JSON containing account info
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
