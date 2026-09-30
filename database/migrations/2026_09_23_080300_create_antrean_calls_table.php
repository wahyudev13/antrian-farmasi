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
        Schema::create('antrean_calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('antrean_id')->constrained('antreans')->cascadeOnDelete();
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
        Schema::dropIfExists('antrean_calls');
    }
};
