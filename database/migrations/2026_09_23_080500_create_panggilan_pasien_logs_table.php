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
        Schema::create('panggilan_pasien_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('panggilan_pasien_id')->constrained('panggilan_pasien')->cascadeOnDelete();
            $table->foreignId('loket_id')->constrained('lokets')->cascadeOnDelete();
            $table->foreignId('petugas_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('nomor_panggilan')->default(1);
            $table->dateTime('waktu_panggilan')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('panggilan_pasien_logs');
    }
};
