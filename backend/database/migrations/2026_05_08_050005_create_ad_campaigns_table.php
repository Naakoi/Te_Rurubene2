<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type'); // 'audio', 'banner', 'sponsored_track'
            $table->string('media_path')->nullable();
            $table->string('target_url')->nullable();
            $table->decimal('budget', 10, 2);
            $table->decimal('spent', 10, 2)->default(0.00);
            $table->integer('impressions')->default(0);
            $table->integer('clicks')->default(0);
            $table->string('status')->default('pending'); // 'pending', 'active', 'completed', 'paused'
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_campaigns');
    }
};
