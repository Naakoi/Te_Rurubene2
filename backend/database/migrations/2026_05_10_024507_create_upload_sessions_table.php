<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('upload_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('upload_id')->unique();
            $table->string('file_name');
            $table->string('media_type');
            $table->string('status')->default('uploading'); // uploading, processing, completed, failed
            $table->boolean('is_premium')->default(false);
            $table->decimal('price', 8, 2)->default(0.00);
            $table->json('parts')->nullable(); // Store ETags and part numbers
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('upload_sessions');
    }
};
