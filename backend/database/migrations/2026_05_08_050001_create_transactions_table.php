<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('type'); // 'credit' or 'debit'
            $table->string('source'); // 'stripe', 'paypal', 'royalty', 'tip', 'subscription', 'withdrawal'
            $table->string('reference_id')->nullable(); // external gateway ID or internal relation ID
            $table->string('status')->default('completed'); // 'pending', 'completed', 'failed'
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
