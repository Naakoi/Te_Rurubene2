<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('creator_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->cascadeOnDelete();
            $table->string('recipient_type'); // artist, studio, platform
            $table->unsignedBigInteger('recipient_id')->nullable(); // null for platform
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending'); // pending, available, withdrawn, refunded
            $table->timestamp('release_at')->nullable(); // release escrow hold
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('creator_earnings');
    }
};
