<?php

namespace App\Http\Controllers;

use App\Events\AntreanDipanggil;
use App\Events\AntreanStatusSelesai;
use App\Events\PasienDipanggil;
use App\Models\Antrean;
use App\Models\AntreanCall;
use App\Models\Loket;
use App\Models\PanggilanPasien;
use App\Models\PanggilanPasienLog;
use App\Models\Pengaturan;
use App\Services\KhanzaPatientService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PemanggilanController extends Controller
{
    /**
     * Unified staff counter desk displaying all active lokets for a single operator.
     */
    public function index(Request $request): Response
    {
        $lokets = Loket::aktif()->ordered()->get();
        $today = Carbon::today()->toDateString();
        $padding = (int) Pengaturan::get('queue_padding', 3);

        $allToday = Antrean::hariIni()
            ->select([
                'id', 'tanggal', 'prefix', 'nomor', 'nomor_urut',
                'nama_pasien', 'loket_id', 'status', 'waktu_panggil',
                'waktu_daftar', 'jumlah_panggilan', 'petugas_id', 'updated_at',
            ])
            ->get();

        $loketsData = $lokets->map(function ($loket) use ($allToday, $padding) {
            $prefix = $loket->prefix ?: 'A';

            $currentAntrean = $allToday
                ->where('loket_id', $loket->id)
                ->whereIn('status', ['dipanggil', 'dilayani'])
                ->sortByDesc('waktu_panggil')
                ->first();

            if ($currentAntrean) {
                $currentAntrean->load(['loket:id,nama,prefix,nomor_display', 'petugas:id,name']);
            }

            $waitingAntreans = $allToday
                ->where('status', 'menunggu')
                ->filter(fn ($a) => $a->loket_id == $loket->id || ($a->loket_id === null && $a->prefix === $prefix))
                ->sortBy('nomor_urut')
                ->values();
            $waitingCount = $waitingAntreans->count();

            $skippedAntreans = $allToday
                ->where('status', 'terlewat')
                ->filter(fn ($a) => $a->loket_id == $loket->id || ($a->loket_id === null && $a->prefix === $prefix))
                ->sortByDesc('updated_at')
                ->values();
            $skippedCount = $skippedAntreans->count();

            $recentHistory = $allToday
                ->where('loket_id', $loket->id)
                ->whereIn('status', ['selesai', 'terlewat'])
                ->sortByDesc('updated_at')
                ->take(3)
                ->values();

            $lastNumber = $allToday
                ->where('prefix', $prefix)
                ->max('nomor_urut') ?? 0;

            $nextNomor = $prefix.str_pad((string) ($lastNumber + 1), $padding, '0', STR_PAD_LEFT);

            return [
                'id' => $loket->id,
                'kode' => $loket->kode,
                'nama' => $loket->nama,
                'prefix' => $prefix,
                'warna' => $loket->warna ?? '#10b981',
                'nomor_display' => $loket->nomor_display,
                'nextNomor' => $nextNomor,
                'currentAntrean' => $currentAntrean,
                'waitingCount' => $waitingCount,
                'waitingAntreans' => $waitingAntreans,
                'skippedCount' => $skippedCount,
                'skippedAntreans' => $skippedAntreans,
                'recentHistory' => $recentHistory,
            ];
        });

        $totalWaiting = $allToday->where('status', 'menunggu')->count();
        $totalServed = $allToday->where('status', 'selesai')->count();
        $totalSkipped = $allToday->where('status', 'terlewat')->count();

        return Inertia::render('Pemanggilan/Index', [
            'loketsData' => $loketsData,
            'totalWaiting' => $totalWaiting,
            'totalServed' => $totalServed,
            'totalSkipped' => $totalSkipped,
        ]);
    }

    /**
     * Call next waiting queue ticket at this counter.
     */
    public function panggilBerikutnya(Request $request): RedirectResponse
    {
        $request->validate([
            'loket_id' => ['required', 'exists:lokets,id'],
        ], [
            'loket_id.required' => 'Loket harus dipilih terlebih dahulu.',
            'loket_id.exists' => 'Loket tidak valid.',
        ]);

        $loket = Loket::findOrFail($request->loket_id);
        $prefix = $loket->prefix ?: 'A';

        // Atomically find and claim next waiting queue ticket for this loket or prefix
        $now = now();
        $nextAntrean = DB::transaction(function () use ($loket, $prefix, $request, $now) {
            $ticket = Antrean::hariIni()
                ->where('status', 'menunggu')
                ->where(function ($q) use ($loket, $prefix) {
                    $q->where('loket_id', $loket->id)
                        ->orWhere(function ($sub) use ($prefix) {
                            $sub->whereNull('loket_id')->where('prefix', $prefix);
                        });
                })
                ->orderBy('nomor_urut', 'asc')
                ->lockForUpdate()
                ->first();

            if (! $ticket) {
                return null;
            }

            $ticket->update([
                'loket_id' => $loket->id,
                'petugas_id' => $request->user()->id,
                'status' => 'dipanggil',
                'waktu_panggil' => $now,
                'jumlah_panggilan' => 1,
            ]);

            AntreanCall::create([
                'antrean_id' => $ticket->id,
                'loket_id' => $loket->id,
                'petugas_id' => $request->user()->id,
                'nomor_panggilan' => 1,
                'waktu_panggilan' => $now,
            ]);

            return $ticket;
        });

        if (! $nextAntrean) {
            return redirect()->back()->with('error', "Tidak ada antrean yang sedang menunggu untuk {$loket->nama} (Prefix {$prefix}).");
        }

        // Broadcast via WebSocket to Display
        $this->safeBroadcast(new AntreanDipanggil($nextAntrean));

        return redirect()->back()->with([
            'success' => "Memanggil nomor antrean {$nextAntrean->nomor} ke {$loket->nama}.",
            'called_audio' => [
                'type' => 'antrean',
                'nomor' => $nextAntrean->nomor,
                'nama' => $nextAntrean->nama_pasien,
                'loket' => $loket->nama,
                'nomor_display' => $loket->nomor_display,
            ],
        ]);
    }

    /**
     * Call a specific queue ticket directly from the waiting list.
     */
    public function panggil(Antrean $antrean, Request $request): RedirectResponse
    {
        $loket = Loket::find($request->input('loket_id')) ?? $antrean->loket ?? Loket::first();
        if (! $loket) {
            return redirect()->back()->with('error', 'Loket tidak ditemukan.');
        }

        $now = now();
        $newCount = ($antrean->jumlah_panggilan ?: 0) + 1;

        $antrean->update([
            'loket_id' => $loket->id,
            'petugas_id' => $request->user()->id,
            'status' => 'dipanggil',
            'waktu_panggil' => $now,
            'jumlah_panggilan' => $newCount,
        ]);

        AntreanCall::create([
            'antrean_id' => $antrean->id,
            'loket_id' => $loket->id,
            'petugas_id' => $request->user()->id,
            'nomor_panggilan' => $newCount,
            'waktu_panggilan' => $now,
        ]);

        $this->safeBroadcast(new AntreanDipanggil($antrean));

        return redirect()->back()->with([
            'success' => "Memanggil nomor antrean {$antrean->nomor} ke {$loket->nama}.",
            'called_audio' => [
                'type' => 'antrean',
                'nomor' => $antrean->nomor,
                'nama' => $antrean->nama_pasien,
                'loket' => $loket->nama,
                'nomor_display' => $loket->nomor_display,
            ],
        ]);
    }

    /**
     * Recall current queue ticket.
     */
    public function panggilUlang(Antrean $antrean, Request $request): RedirectResponse
    {
        $loket = $antrean->loket ?? Loket::find($request->input('loket_id'));
        if (! $loket) {
            return redirect()->back()->with('error', 'Loket tidak ditemukan.');
        }

        $now = now();
        $newCount = $antrean->jumlah_panggilan + 1;

        $antrean->update([
            'loket_id' => $loket->id,
            'petugas_id' => $request->user()->id,
            'status' => 'dipanggil',
            'waktu_panggil' => $now,
            'jumlah_panggilan' => $newCount,
        ]);

        AntreanCall::create([
            'antrean_id' => $antrean->id,
            'loket_id' => $loket->id,
            'petugas_id' => $request->user()->id,
            'nomor_panggilan' => $newCount,
            'waktu_panggilan' => $now,
        ]);

        // Broadcast via WebSocket to Display
        $this->safeBroadcast(new AntreanDipanggil($antrean));

        return redirect()->back()->with([
            'success' => "Panggilan ulang ke-{$newCount} untuk nomor {$antrean->nomor}.",
            'called_audio' => [
                'type' => 'antrean',
                'nomor' => $antrean->nomor,
                'nama' => $antrean->nama_pasien,
                'loket' => $loket->nama,
                'nomor_display' => $loket->nomor_display,
            ],
        ]);
    }

    /**
     * Start serving current ticket.
     */
    public function mulaiLayani(Antrean $antrean): RedirectResponse
    {
        $antrean->update([
            'status' => 'dilayani',
        ]);

        return redirect()->back()->with('success', "Status antrean {$antrean->nomor} diubah menjadi DILAYANI.");
    }

    /**
     * Finish serving current ticket.
     */
    public function selesai(Antrean $antrean): RedirectResponse
    {
        $antrean->update([
            'status' => 'selesai',
            'waktu_selesai' => now(),
        ]);

        $this->safeBroadcast(new AntreanStatusSelesai($antrean));

        return redirect()->back()->with('success', "Pelayanan antrean {$antrean->nomor} telah SELESAI.");
    }

    /**
     * Skip/pass current ticket.
     */
    public function lewati(Antrean $antrean): RedirectResponse
    {
        $antrean->update([
            'status' => 'terlewat',
        ]);

        return redirect()->back()->with('success', "Nomor antrean {$antrean->nomor} ditandai TERLEWAT.");
    }

    /**
     * Direct patient calling desk page integrated with SIMRS Khanza reg_periksa.
     */
    public function pasienIndex(Request $request, KhanzaPatientService $khanzaService): Response
    {
        $lokets = Loket::aktif()->ordered()->get();
        $selectedLoket = $lokets->first();

        // Recent patient calls today
        $recentCalls = PanggilanPasien::hariIni()
            ->with(['loket', 'petugas'])
            ->latest('waktu_panggil')
            ->take(30)
            ->get();

        $tanggal = $request->query('tanggal', now()->toDateString());
        $search = $request->query('search');
        $kdPoli = $request->query('kd_poli');
        $kdDokter = $request->query('kd_dokter');

        $polikliniks = $khanzaService->getPoliklinikList();
        $dokters = $khanzaService->getDokterList();
        $simrsPatients = $khanzaService->getRegisteredPatients($tanggal, $search, $kdPoli, $kdDokter, 100);

        return Inertia::render('Pemanggilan/Pasien', [
            'lokets' => $lokets,
            'selectedLoket' => $selectedLoket,
            'recentCalls' => $recentCalls,
            'simrsPatients' => $simrsPatients,
            'polikliniks' => $polikliniks,
            'dokters' => $dokters,
            'filters' => [
                'tanggal' => $tanggal,
                'search' => $search,
                'kd_poli' => $kdPoli,
                'kd_dokter' => $kdDokter,
            ],
        ]);
    }

    /**
     * Live search endpoint for SIMRS Khanza reg_periksa patients.
     */
    public function searchSimrs(Request $request, KhanzaPatientService $khanzaService): JsonResponse
    {
        $keyword = $request->query('q', '');
        $tanggal = $request->query('tanggal');
        $kdPoli = $request->query('kd_poli');
        $kdDokter = $request->query('kd_dokter');

        $patients = $khanzaService->getRegisteredPatients($tanggal, $keyword, $kdPoli, $kdDokter, 60);

        return response()->json($patients);
    }

    /**
     * Call direct patient by name (with automatic loket fallback).
     */
    public function panggilPasien(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_pasien' => ['required', 'string', 'max:255'],
            'loket_id' => ['nullable', 'exists:lokets,id'],
            'no_rawat' => ['nullable', 'string', 'max:50'],
            'no_rkm_medis' => ['nullable', 'string', 'max:30'],
            'jenis_kelamin' => ['nullable', 'in:L,P'],
        ], [
            'nama_pasien.required' => 'Nama pasien wajib diisi untuk dipanggil.',
        ]);

        $loketId = $validated['loket_id'] ?? null;
        $loket = $loketId ? Loket::find($loketId) : null;
        if (! $loket) {
            $loket = Loket::aktif()->ordered()->first() ?? Loket::first();
        }

        if (! $loket) {
            return redirect()->back()->with('error', 'Tidak ada loket aktif untuk melakukan pemanggilan.');
        }

        $now = now();

        // Cek apakah pasien sudah pernah dipanggil hari ini (berdasarkan no_rawat, no_rkm_medis, atau nama)
        $existing = null;
        if (! empty($validated['no_rawat'])) {
            $existing = PanggilanPasien::hariIni()
                ->where('no_rawat', $validated['no_rawat'])
                ->latest('waktu_panggil')
                ->first();
        } elseif (! empty($validated['no_rkm_medis'])) {
            $existing = PanggilanPasien::hariIni()
                ->where('no_rkm_medis', $validated['no_rkm_medis'])
                ->latest('waktu_panggil')
                ->first();
        } else {
            $existing = PanggilanPasien::hariIni()
                ->where('nama_pasien', $validated['nama_pasien'])
                ->latest('waktu_panggil')
                ->first();
        }

        if ($existing) {
            // Jika sudah ada data panggilan hari ini, delegasikan ke panggilPasienUlang agar jumlah_panggilan naik (+1)
            $request->merge(['loket_id' => $loket->id]);

            return $this->panggilPasienUlang($existing, $request);
        }

        $panggilan = PanggilanPasien::create([
            'nama_pasien' => $validated['nama_pasien'],
            'no_rawat' => $validated['no_rawat'] ?? null,
            'no_rkm_medis' => $validated['no_rkm_medis'] ?? null,
            'jenis_kelamin' => $validated['jenis_kelamin'] ?? null,
            'loket_id' => $loket->id,
            'petugas_id' => $request->user()->id,
            'status' => 'dipanggil',
            'waktu_panggil' => $now,
            'jumlah_panggilan' => 1,
        ]);

        PanggilanPasienLog::create([
            'panggilan_pasien_id' => $panggilan->id,
            'loket_id' => $loket->id,
            'petugas_id' => $request->user()->id,
            'nomor_panggilan' => 1,
            'waktu_panggilan' => $now,
        ]);

        // Broadcast via WebSocket to Display
        $this->safeBroadcast(new PasienDipanggil($panggilan));

        return redirect()->back()->with([
            'success' => "Memanggil pasien {$panggilan->nama_pasien} ke {$loket->nama}.",
            'called_audio' => [
                'type' => 'pasien',
                'nomor' => null,
                'nama' => $panggilan->nama_pasien,
                'loket' => $loket->nama,
                'nomor_display' => $loket->nomor_display,
            ],
        ]);
    }

    /**
     * Recall direct patient.
     */
    public function panggilPasienUlang(PanggilanPasien $panggilanPasien, Request $request): RedirectResponse
    {
        $loket = $panggilanPasien->loket ?? Loket::find($request->input('loket_id'));
        if (! $loket) {
            return redirect()->back()->with('error', 'Loket tidak ditemukan.');
        }

        $now = now();
        $newCount = $panggilanPasien->jumlah_panggilan + 1;

        $panggilanPasien->update([
            'loket_id' => $loket->id,
            'petugas_id' => $request->user()->id,
            'status' => 'dipanggil',
            'waktu_panggil' => $now,
            'jumlah_panggilan' => $newCount,
        ]);

        PanggilanPasienLog::create([
            'panggilan_pasien_id' => $panggilanPasien->id,
            'loket_id' => $loket->id,
            'petugas_id' => $request->user()->id,
            'nomor_panggilan' => $newCount,
            'waktu_panggilan' => $now,
        ]);

        // Broadcast via WebSocket to Display
        $this->safeBroadcast(new PasienDipanggil($panggilanPasien));

        return redirect()->back()->with([
            'success' => "Panggilan ulang ke-{$newCount} untuk pasien {$panggilanPasien->nama_pasien}.",
            'called_audio' => [
                'type' => 'pasien',
                'nomor' => null,
                'nama' => $panggilanPasien->nama_pasien,
                'loket' => $loket->nama,
                'nomor_display' => $loket->nomor_display,
            ],
        ]);
    }

    /**
     * Mark patient call as completed.
     */
    public function selesaiPasien(PanggilanPasien $panggilanPasien): RedirectResponse
    {
        $panggilanPasien->update([
            'status' => 'selesai',
            'waktu_selesai' => now(),
        ]);

        return redirect()->back()->with('success', "Pelayanan pasien {$panggilanPasien->nama_pasien} telah selesai.");
    }

    /**
     * Safely broadcast event without throwing exception if websocket server is unreachable.
     */
    private function safeBroadcast(object $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed: '.$e->getMessage());
        }
    }
}
