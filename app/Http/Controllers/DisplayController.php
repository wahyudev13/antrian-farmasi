<?php

namespace App\Http\Controllers;

use App\Events\DisplayTestSound;
use App\Models\Antrean;
use App\Models\Loket;
use App\Models\PanggilanPasien;
use App\Models\Pengaturan;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DisplayController extends Controller
{
    /**
     * Public queue & patient display screen for pharmacy waiting area.
     */
    public function index(): Response
    {
        $settings = Pengaturan::getAllSettings();
        $logoUrl = null;
        if (! empty($settings['logo_rs'])) {
            $logoUrl = Storage::disk('public')->url($settings['logo_rs']);
        }

        $activeLokets = Loket::aktif()->ordered()->get()->map(function ($loket) {
            // Get latest called antrean today (keeps displaying even after status is selesai)
            $current = Antrean::hariIni()
                ->where('loket_id', $loket->id)
                ->whereNotNull('waktu_panggil')
                ->latest('waktu_panggil')
                ->first();

            return [
                'id' => $loket->id,
                'kode' => $loket->kode,
                'nama' => $loket->nama,
                'prefix' => $loket->prefix,
                'nomor_display' => $loket->nomor_display,
                'warna' => $loket->warna ?? '#2563eb',
                'nomor_antrean' => $current?->nomor,
                'nama_pasien' => $current?->nama_pasien,
                'status_antrean' => $current?->status,
            ];
        });

        // Latest active call (only if currently dipanggil or dilayani)
        $latestAntrean = Antrean::hariIni()
            ->whereIn('status', ['dipanggil', 'dilayani'])
            ->with('loket')
            ->latest('waktu_panggil')
            ->first();

        // Latest active patient call
        $latestPasien = PanggilanPasien::hariIni()
            ->whereIn('status', ['dipanggil', 'dilayani'])
            ->with('loket')
            ->latest('waktu_panggil')
            ->first();

        return Inertia::render('Display/Index', [
            'settings' => [
                ...$settings,
                'logo_url' => $logoUrl,
            ],
            'currentDate' => now()->toDateString(),
            'lokets' => $activeLokets,
            'latestAntrean' => $latestAntrean,
            'latestPasien' => $latestPasien,
        ]);
    }

    /**
     * JSON API endpoint for live polling by the display screen.
     *
     * @return JsonResponse
     */
    public function status()
    {
        $activeLokets = Loket::aktif()->ordered()->get()->map(function ($loket) {
            // Get latest called antrean today (keeps displaying even after status is selesai)
            $current = Antrean::hariIni()
                ->where('loket_id', $loket->id)
                ->whereNotNull('waktu_panggil')
                ->latest('waktu_panggil')
                ->first();

            return [
                'id' => $loket->id,
                'kode' => $loket->kode,
                'nama' => $loket->nama,
                'prefix' => $loket->prefix,
                'nomor_display' => $loket->nomor_display,
                'warna' => $loket->warna ?? '#2563eb',
                'nomor_antrean' => $current?->nomor,
                'nama_pasien' => $current?->nama_pasien,
                'status_antrean' => $current?->status,
            ];
        });

        $latestAntrean = Antrean::hariIni()
            ->whereIn('status', ['dipanggil', 'dilayani'])
            ->with('loket')
            ->latest('waktu_panggil')
            ->first();

        $latestPasien = PanggilanPasien::hariIni()
            ->whereIn('status', ['dipanggil', 'dilayani'])
            ->with('loket')
            ->latest('waktu_panggil')
            ->first();

        // Determine which call is more recent
        $antreanTime = $latestAntrean?->waktu_panggil?->timestamp ?? 0;
        $pasienTime = $latestPasien?->waktu_panggil?->timestamp ?? 0;

        $currentCall = null;
        if ($antreanTime >= $pasienTime && $latestAntrean) {
            $currentCall = [
                'type' => 'antrean',
                'call_key' => 'antrean_'.$latestAntrean->id.'_'.$latestAntrean->jumlah_panggilan.'_'.$antreanTime,
                'nomor' => $latestAntrean->nomor,
                'nama' => $latestAntrean->nama_pasien,
                'loket' => $latestAntrean->loket?->nama ?? 'Loket 1',
                'nomor_display' => $latestAntrean->loket?->nomor_display ?? 1,
                'loket_id' => $latestAntrean->loket_id,
            ];
        } elseif ($latestPasien) {
            $currentCall = [
                'type' => 'pasien',
                'call_key' => 'pasien_'.$latestPasien->id.'_'.$latestPasien->jumlah_panggilan.'_'.$pasienTime,
                'nomor' => null,
                'nama' => $latestPasien->nama_pasien,
                'loket' => $latestPasien->loket?->nama ?? 'Loket 1',
                'nomor_display' => $latestPasien->loket?->nomor_display ?? 1,
                'loket_id' => $latestPasien->loket_id,
            ];
        }

        $testSound = Cache::get('display_test_sound');

        return response()->json([
            'current_date' => now()->toDateString(),
            'lokets' => $activeLokets,
            'currentCall' => $currentCall,
            'testSound' => $testSound,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Broadcast a test audio call to the display screen.
     */
    public function testSound(): JsonResponse
    {
        $testCall = [
            'type' => 'test',
            'id' => 0,
            'call_key' => 'test_sound_'.now()->timestamp.'_'.uniqid(),
            'nomor' => null,
            'nama' => null,
            'loket_id' => null,
            'loket' => null,
            'nomor_display' => null,
            'jumlah_panggilan' => 1,
            'timestamp' => now()->timestamp,
        ];

        Cache::put('display_test_sound', $testCall, now()->addSeconds(30));

        try {
            broadcast(new DisplayTestSound($testCall));
        } catch (\Throwable) {
            // Broadcasting fallback handled by polling
        }

        return response()->json([
            'success' => true,
            'message' => 'Tes suara display berhasil dikirim ke layar antrean.',
            'callData' => $testCall,
        ]);
    }
}
