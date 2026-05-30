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
        Schema::create('podcast_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('podcast_series', function (Blueprint $table) {
            $table->id();
            $table->foreignId('podcast_id')->constrained('podcasts')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('cover_image')->nullable();
            $table->timestamps();
        });

        Schema::create('podcast_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('podcast_episode_id')->constrained('podcast_episodes')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at');
        });

        Schema::table('podcasts', function (Blueprint $table) {
            $table->dropForeign(['artist_id']);
            $table->dropColumn('artist_id');
            
            $table->foreignId('studio_id')->after('id')->constrained('studios')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->after('studio_id')->constrained('podcast_categories')->nullOnDelete();
            $table->boolean('is_premium')->default(false)->after('cover_image');
            $table->decimal('price', 8, 2)->default(0)->after('is_premium');
            $table->string('status')->default('active')->after('price');
        });

        Schema::table('podcast_episodes', function (Blueprint $table) {
            $table->foreignId('podcast_series_id')->nullable()->after('podcast_id')->constrained('podcast_series')->nullOnDelete();
            $table->integer('season_number')->nullable()->after('description');
            $table->integer('episode_number')->nullable()->after('season_number');
            $table->string('video_url')->nullable()->after('audio_file_path');
            $table->string('hls_path')->nullable()->after('video_url');
            $table->string('waveform_url')->nullable()->after('hls_path');
            $table->boolean('is_premium')->default(false)->after('duration');
            $table->decimal('price', 8, 2)->default(0)->after('is_premium');
            $table->json('guest_speakers')->nullable()->after('price');
            $table->string('status')->default('processing')->after('guest_speakers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('podcast_episodes', function (Blueprint $table) {
            $table->dropForeign(['podcast_series_id']);
            $table->dropColumn([
                'podcast_series_id', 'season_number', 'episode_number', 
                'video_url', 'hls_path', 'waveform_url', 
                'is_premium', 'price', 'guest_speakers', 'status'
            ]);
        });

        Schema::table('podcasts', function (Blueprint $table) {
            $table->dropForeign(['studio_id']);
            $table->dropForeign(['category_id']);
            $table->dropColumn(['studio_id', 'category_id', 'is_premium', 'price', 'status']);
            $table->foreignId('artist_id')->after('id')->constrained('artists')->cascadeOnDelete();
        });

        Schema::dropIfExists('podcast_views');
        Schema::dropIfExists('podcast_series');
        Schema::dropIfExists('podcast_categories');
    }
};
