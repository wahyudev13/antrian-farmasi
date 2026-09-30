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
        Schema::create('antreans', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal')->index();
            $table->string('prefix', 10)->default('A');
            $table->string('nomor', 20)->index();
            $table->unsignedInteger('nomor_urut');
            $table->string('no_rawat', 50)->nullable()->index();
            $table->string('no_rkm_medis', 30)->nullable()->index();
            $table->string('nama_pasien');
            $table->string('jenis_kelamin', 20)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->foreignId('loket_id')->nullable()->constrained('lokets')->nullOnDelete();
            $table->enum('status', ['menunggu', 'dipanggil', 'dilayani', 'selesai', 'terlewat', 'batal'])->default('menunggu')->index();
            $table->dateTime('waktu_daftar')->index();
            $table->dateTime('waktu_panggil')->nullable();
            $table->dateTime('waktu_selesai')->nullable();
            $table->unsignedInteger('jumlah_panggilan')->default(0);
            $table->foreignId('petugas_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['tanggal', 'prefix', 'nomor_urut'], 'unique_antrean_per_hari');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('antreans');
    }
};
