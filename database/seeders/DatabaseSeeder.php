<?php

namespace Database\Seeders;

use App\Models\Loket;
use App\Models\Pengaturan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Initial Users
        User::updateOrCreate(
            ['email' => 'admin@rs.local'],
            [
                'name' => 'Administrator Farmasi',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'aktif',
            ]
        );

        User::updateOrCreate(
            ['email' => 'petugas@rs.local'],
            [
                'name' => 'Petugas Farmasi',
                'username' => 'petugas',
                'password' => Hash::make('password'),
                'role' => 'petugas',
                'status' => 'aktif',
            ]
        );

        // 2. Initial Lokets (Dinamis)
        $lokets = [
            ['kode' => 'L01', 'nama' => 'Loket 1', 'nomor_display' => 1, 'status' => 'aktif', 'urutan' => 1],
            ['kode' => 'L02', 'nama' => 'Loket 2', 'nomor_display' => 2, 'status' => 'aktif', 'urutan' => 2],
            ['kode' => 'L03', 'nama' => 'Loket 3', 'nomor_display' => 3, 'status' => 'aktif', 'urutan' => 3],
        ];

        foreach ($lokets as $loket) {
            Loket::updateOrCreate(['kode' => $loket['kode']], $loket);
        }

        // 3. Initial App Settings
        $settings = [
            ['key' => 'nama_rumah_sakit', 'value' => 'RS PKU MUHAMMADIYAH SEKAPUK', 'deskripsi' => 'Nama Resmi Rumah Sakit'],
            ['key' => 'nama_unit', 'value' => 'Instalasi Farmasi', 'deskripsi' => 'Nama Unit Layanan Farmasi'],
            ['key' => 'alamat_rs', 'value' => 'Jl. Raya Daendels No. 1, Sekapuk, Kec. Ujungpangkah, Kab. Gresik', 'deskripsi' => 'Alamat Instansi Rumah Sakit'],
            ['key' => 'running_text', 'value' => 'Selamat Datang di Instalasi Farmasi RS PKU Muhammadiyah Sekapuk. Budayakan tertib dan antre dengan nyaman.', 'deskripsi' => 'Teks Berjalan pada Layar Display'],
            ['key' => 'queue_prefix', 'value' => 'A', 'deskripsi' => 'Prefix Huruf Nomor Antrean'],
            ['key' => 'queue_padding', 'value' => '3', 'deskripsi' => 'Jumlah Digit Angka Nomor Antrean'],
            ['key' => 'daily_reset', 'value' => '1', 'deskripsi' => 'Reset Nomor Antrean Setiap Hari (1: Ya, 0: Tidak)'],
            ['key' => 'display_privacy_mode', 'value' => 'masked', 'deskripsi' => 'Mode Privasi Tampilan Nama Pasien (full, masked, initials)'],
        ];

        foreach ($settings as $setting) {
            Pengaturan::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
