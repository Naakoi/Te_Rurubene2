<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('studio_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('video_file_path')->nullable();
            $table->string('hls_path')->nullable(); // For adaptive streaming
            $table->integer('duration')->nullable(); // in seconds
            $table->boolean('is_premium')->default(false);
            $table->boolean('is_short')->default(false); // TikTok-style feed flag
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
