<?php

use App\Http\Controllers\AntreanController;
use App\Http\Controllers\DisplayController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\LoketController;
use App\Http\Controllers\PemanggilanController;
use App\Http\Controllers\PengaturanController;
use App\Http\Controllers\ProfileController;
use App\Models\Antrean;
use App\Models\Loket;
use App\Models\PanggilanPasien;
use Carbon\Carbon;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Public Display Screen & Status API (No Login Required)
Route::get('/display', [DisplayController::class, 'index'])->name('display.index');
Route::get('/api/display/status', [DisplayController::class, 'status'])->name('display.status');

Route::middleware(['auth'])->group(function () {
    Route::post('/display/test-sound', [DisplayController::class, 'testSound'])->name('display.test-sound');

    Route::get('/dashboard', function () {
        $today = Carbon::today()->toDateString();
        $antreanStats = [
            'total' => Antrean::whereDate('tanggal', $today)->count(),
            'menunggu' => Antrean::whereDate('tanggal', $today)->where('status', 'menunggu')->count(),
            'dipanggil' => Antrean::whereDate('tanggal', $today)->where('status', 'dipanggil')->count(),
            'selesai' => Antrean::whereDate('tanggal', $today)->where('status', 'selesai')->count(),
        ];
        $pasienStats = [
            'total' => PanggilanPasien::hariIni()->count(),
            'dipanggil' => PanggilanPasien::hariIni()->where('status', 'dipanggil')->count(),
            'dilayani' => PanggilanPasien::hariIni()->where('status', 'dilayani')->count(),
            'selesai' => PanggilanPasien::hariIni()->where('status', 'selesai')->count(),
        ];
        $totalLoket = Loket::aktif()->count();

        return Inertia::render('Dashboard', [
            'antreanStats' => $antreanStats,
            'pasienStats' => $pasienStats,
            'totalLoket' => $totalLoket,
        ]);
    })->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Modul Antrean (Admin & Petugas)
    Route::get('/antrean', [AntreanController::class, 'index'])->name('antrean.index');
    Route::get('/antrean/create', [AntreanController::class, 'create'])->name('antrean.create');
    Route::post('/antrean', [AntreanController::class, 'store'])->name('antrean.store');
    Route::get('/antrean/{antrean}/cetak', [AntreanController::class, 'cetak'])->name('antrean.cetak');
    Route::delete('/antrean/{antrean}', [AntreanController::class, 'destroy'])->name('antrean.destroy');

    // Modul Meja Kerja Pemanggilan Antrean (Admin & Petugas)
    Route::get('/pemanggilan', [PemanggilanController::class, 'index'])->name('pemanggilan.index');
    Route::post('/pemanggilan/panggil-berikutnya', [PemanggilanController::class, 'panggilBerikutnya'])->name('pemanggilan.next');
    Route::post('/pemanggilan/{antrean}/panggil', [PemanggilanController::class, 'panggil'])->name('pemanggilan.panggil');
    Route::post('/pemanggilan/{antrean}/ulang', [PemanggilanController::class, 'panggilUlang'])->name('pemanggilan.ulang');
    Route::patch('/pemanggilan/{antrean}/layani', [PemanggilanController::class, 'mulaiLayani'])->name('pemanggilan.layani');
    Route::patch('/pemanggilan/{antrean}/selesai', [PemanggilanController::class, 'selesai'])->name('pemanggilan.selesai');
    Route::patch('/pemanggilan/{antrean}/lewati', [PemanggilanController::class, 'lewati'])->name('pemanggilan.lewati');

    // Modul Pemanggilan Pasien Langsung (Admin & Petugas)
    Route::get('/pemanggilan-pasien', [PemanggilanController::class, 'pasienIndex'])->name('pemanggilan.pasien.index');
    Route::get('/pemanggilan-pasien/search-simrs', [PemanggilanController::class, 'searchSimrs'])->name('pemanggilan.pasien.search-simrs');
    Route::post('/pemanggilan-pasien', [PemanggilanController::class, 'panggilPasien'])->name('pemanggilan.pasien.store');
    Route::post('/pemanggilan-pasien/{panggilanPasien}/ulang', [PemanggilanController::class, 'panggilPasienUlang'])->name('pemanggilan.pasien.ulang');
    Route::patch('/pemanggilan-pasien/{panggilanPasien}/selesai', [PemanggilanController::class, 'selesaiPasien'])->name('pemanggilan.pasien.selesai');

    // Modul Laporan & Rekapitulasi (Tahap 3 - Admin & Petugas)
    Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan.index');
    Route::get('/laporan/export', [LaporanController::class, 'export'])->name('laporan.export');
    Route::get('/laporan/cetak', [LaporanController::class, 'cetak'])->name('laporan.cetak');

    // Admin Only: Master Data Loket & Pengaturan
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/loket', [LoketController::class, 'index'])->name('loket.index');
        Route::post('/loket', [LoketController::class, 'store'])->name('loket.store');
        Route::put('/loket/{loket}', [LoketController::class, 'update'])->name('loket.update');
        Route::patch('/loket/{loket}/toggle', [LoketController::class, 'toggleStatus'])->name('loket.toggle');
        Route::delete('/loket/{loket}', [LoketController::class, 'destroy'])->name('loket.destroy');

        Route::get('/pengaturan', [PengaturanController::class, 'index'])->name('pengaturan.index');
        Route::post('/pengaturan', [PengaturanController::class, 'update'])->name('pengaturan.update');
        Route::delete('/pengaturan/logo', [PengaturanController::class, 'hapusLogo'])->name('pengaturan.destroy-logo');
    });
});

require __DIR__.'/auth.php';
