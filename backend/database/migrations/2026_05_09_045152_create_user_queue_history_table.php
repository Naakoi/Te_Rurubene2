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
        Schema::create('user_queue_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('playback_session_id')->nullable()->constrained('playback_sessions')->onDelete('set null');
            $table->string('media_type'); // 'audio' or 'video'
            $table->unsignedBigInteger('media_id');
            $table->timestamp('played_at');
            $table->timestamps();

            // Create index for fast auto-play exclusion queries
            $table->index(['user_id', 'media_type', 'media_id']);
            $table->index('played_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_queue_history');
    }
};
