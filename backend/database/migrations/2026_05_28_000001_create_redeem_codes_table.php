<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('redeem_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();              // e.g. RURUBENE-2025-FREE50
            $table->decimal('amount', 10, 2);             // credit amount to apply
            $table->string('currency')->default('AUD');
            $table->string('status')->default('active');  // active | used | expired
            $table->string('description')->nullable();    // admin note
            $table->unsignedBigInteger('created_by')->nullable();  // admin user ID
            $table->unsignedBigInteger('used_by')->nullable();     // redeemer user ID
            $table->timestamp('used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('used_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('redeem_codes');
    }
};
