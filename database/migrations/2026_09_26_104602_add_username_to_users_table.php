<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
        });

        // Backfill existing users
        $users = User::all();
        foreach ($users as $user) {
            $username = match ($user->email) {
                'admin@rs.local' => 'admin',
                'petugas@rs.local' => 'petugas',
                default => Str::before($user->email, '@'),
            };

            // Ensure unique
            $baseUsername = $username;
            $counter = 1;
            while (User::where('username', $username)->where('id', '!=', $user->id)->exists()) {
                $username = $baseUsername.$counter;
                $counter++;
            }

            $user->update(['username' => $username]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('username');
        });
    }
};
