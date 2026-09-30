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
        Schema::table('panggilan_pasien', function (Blueprint $table) {
            $table->string('no_rawat', 50)->nullable()->change();
            $table->string('no_rkm_medis', 30)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('panggilan_pasien', function (Blueprint $table) {
            $table->string('no_rawat', 50)->nullable(false)->change();
            $table->string('no_rkm_medis', 30)->nullable(false)->change();
        });
    }
};
