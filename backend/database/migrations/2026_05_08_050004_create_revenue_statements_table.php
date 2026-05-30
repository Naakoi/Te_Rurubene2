<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revenue_statements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('month'); // e.g. '2026-04'
            $table->integer('total_streams');
            $table->decimal('total_revenue', 10, 2);
            $table->decimal('admin_commission', 10, 2);
            $table->decimal('net_earnings', 10, 2);
            $table->string('status')->default('generated'); // 'generated', 'paid'
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revenue_statements');
    }
};
