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
        Schema::create('panggilan_pasien', function (Blueprint $table) {
            $table->id();
            $table->string('no_rawat', 50)->index();
            $table->string('no_rkm_medis', 30)->index();
            $table->string('nama_pasien');
            $table->string('jenis_kelamin', 20)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->foreignId('loket_id')->constrained('lokets')->cascadeOnDelete();
            $table->foreignId('petugas_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['dipanggil', 'dilayani', 'selesai', 'terlewat', 'batal'])->default('dipanggil')->index();
            $table->dateTime('waktu_panggil')->index();
            $table->dateTime('waktu_selesai')->nullable();
            $table->unsignedInteger('jumlah_panggilan')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('panggilan_pasien');
    }
};
