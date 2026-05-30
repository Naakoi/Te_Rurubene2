<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('stream_key')->unique(); // RTMP key
            $table->string('playback_url')->nullable(); // HLS URL
            $table->boolean('is_premium')->default(false);
            $table->string('status')->default('scheduled'); // 'scheduled', 'live', 'ended'
            $table->timestamp('scheduled_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_events');
    }
};
