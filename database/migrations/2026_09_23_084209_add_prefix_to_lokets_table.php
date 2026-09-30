<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('lokets', function (Blueprint $table) {
            $table->string('prefix', 10)->default('A')->after('nama');
        });

        // Set distinctive prefixes for existing default lokets
        DB::table('lokets')->where('id', 1)->update(['prefix' => 'A']);
        DB::table('lokets')->where('id', 2)->update(['prefix' => 'B']);
        DB::table('lokets')->where('id', '>', 2)->update(['prefix' => 'C']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lokets', function (Blueprint $table) {
            $table->dropColumn('prefix');
        });
    }
};
