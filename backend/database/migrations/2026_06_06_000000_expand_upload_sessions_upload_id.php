<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Change upload_id and file_name columns from VARCHAR(255) to TEXT
     * to support long Cloudflare R2 multipart upload IDs.
     * MySQL cannot index TEXT without a prefix length, so we use raw SQL.
     */
    public function up(): void
    {
        // 1. Drop the unique index on upload_id
        DB::statement('ALTER TABLE upload_sessions DROP INDEX upload_sessions_upload_id_unique');

        // 2. Change both columns to TEXT
        DB::statement('ALTER TABLE upload_sessions MODIFY upload_id TEXT NOT NULL');
        DB::statement('ALTER TABLE upload_sessions MODIFY file_name TEXT NOT NULL');

        // 3. Re-add unique index with a prefix length (190 chars is safe for utf8mb4)
        DB::statement('ALTER TABLE upload_sessions ADD UNIQUE INDEX upload_sessions_upload_id_unique (upload_id(190))');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE upload_sessions DROP INDEX upload_sessions_upload_id_unique');
        DB::statement('ALTER TABLE upload_sessions MODIFY upload_id VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE upload_sessions MODIFY file_name VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE upload_sessions ADD UNIQUE INDEX upload_sessions_upload_id_unique (upload_id)');
    }
};
