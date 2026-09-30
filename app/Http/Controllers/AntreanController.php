<?php

namespace App\Http\Controllers;

use App\Http\Requests\AntreanRequest;
use App\Models\Antrean;
use App\Models\Loket;
use App\Models\Pengaturan;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AntreanController extends Controller
{
    /**
     * Display a listing of queue tickets today.
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $search = $request->query('search');

        $query = Antrean::hariIni()
            ->with(['loket', 'petugas'])
            ->orderBy('id', 'desc');

        if (! empty($status) && $status !== 'semua') {
            $query->where('status', $status);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('nomor', 'like', "%{$search}%")
                    ->orWhere('nama_pasien', 'like', "%{$search}%")
                    ->orWhere('no_rawat', 'like', "%{$search}%")
                    ->orWhere('no_rkm_medis', 'like', "%{$search}%");
            });
        }

        $antreans = $query->paginate(15)->withQueryString();

        // Statistics today
        $today = Carbon::today()->toDateString();
        $stats = [
            'total' => Antrean::whereDate('tanggal', $today)->count(),
            'menunggu' => Antrean::whereDate('tanggal', $today)->where('status', 'menunggu')->count(),
            'dipanggil' => Antrean::whereDate('tanggal', $today)->where('status', 'dipanggil')->count(),
            'dilayani' => Antrean::whereDate('tanggal', $today)->where('status', 'dilayani')->count(),
            'selesai' => Antrean::whereDate('tanggal', $today)->where('status', 'selesai')->count(),
            'terlewat' => Antrean::whereDate('tanggal', $today)->where('status', 'terlewat')->count(),
        ];

        return Inertia::render('Antrean/Index', [
            'antreans' => $antreans,
            'filters' => [
                'status' => $status ?? 'semua',
                'search' => $search ?? '',
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new queue ticket (merged into unified counter desk).
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('pemanggilan.index');
    }

    /**
     * Store a newly created queue ticket with strict anti-duplicate and concurrency protection.
     */
    public function store(AntreanRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $today = Carbon::today()->toDateString();
        $padding = (int) Pengaturan::get('queue_padding', 3);

        $loket = null;
        if (! empty($validated['loket_id'])) {
            $loket = Loket::find($validated['loket_id']);
        }
        if (! $loket) {
            $loket = Loket::aktif()->ordered()->first();
        }

        $prefix = $loket?->prefix ?: Pengaturan::get('queue_prefix', 'A');

        // 1. Prevent duplicate active queue for the same patient (by no_rawat) today
        if (! empty($validated['no_rawat'])) {
            $existingToday = Antrean::hariIni()
                ->where('no_rawat', $validated['no_rawat'])
                ->whereIn('status', ['menunggu', 'dipanggil', 'dilayani'])
                ->first();

            if ($existingToday) {
                return redirect()->back()->with([
                    'warning' => "Pasien dengan No. Rawat {$validated['no_rawat']} sudah memiliki antrean aktif ({$existingToday->nomor}).",
                    'latest_antrean' => $existingToday->load('loket'),
                ]);
            }
        }

        // 2. Anti double-click lock: prevent issuing multiple duplicate tickets within 1 second per user/IP & loket prefix
        $userIdOrIp = $request->user()?->id ? 'user_'.$request->user()->id : 'ip_'.$request->ip();
        $isQuickIssue = empty($validated['nama_pasien']) && empty($validated['no_rawat']) && empty($validated['no_rkm_medis']);

        if ($isQuickIssue) {
            $lockKey = "quick_issue_antrean_{$userIdOrIp}_{$prefix}";
            $lock = Cache::lock($lockKey, 1);
            if (! $lock->get()) {
                $latest = Antrean::hariIni()
                    ->where('prefix', $prefix)
                    ->orderBy('id', 'desc')
                    ->first();

                return redirect()->back()->with([
                    'warning' => "Nomor antrean {$latest?->nomor} baru saja diterbitkan (mencegah klik ganda).",
                    'latest_antrean' => $latest?->load('loket'),
                ]);
            }
        }

        // 3. Concurrency-safe sequence generation with transaction lock & retry
        $maxAttempts = 3;
        $attempt = 0;
        $antrean = null;

        while ($attempt < $maxAttempts && ! $antrean) {
            $attempt++;
            try {
                $antrean = DB::transaction(function () use ($validated, $today, $prefix, $padding, $loket, $request) {
                    $lastNomorUrut = DB::table('antreans')
                        ->whereDate('tanggal', $today)
                        ->where('prefix', $prefix)
                        ->lockForUpdate()
                        ->max('nomor_urut') ?? 0;

                    $nomorUrut = $lastNomorUrut + 1;
                    $nomorFormatted = $prefix.str_pad((string) $nomorUrut, $padding, '0', STR_PAD_LEFT);

                    return Antrean::create([
                        'tanggal' => $today,
                        'prefix' => $prefix,
                        'nomor' => $nomorFormatted,
                        'nomor_urut' => $nomorUrut,
                        'no_rawat' => $validated['no_rawat'] ?? null,
                        'no_rkm_medis' => $validated['no_rkm_medis'] ?? null,
                        'nama_pasien' => ! empty($validated['nama_pasien']) ? $validated['nama_pasien'] : null,
                        'jenis_kelamin' => $validated['jenis_kelamin'] ?? null,
                        'tanggal_lahir' => $validated['tanggal_lahir'] ?? null,
                        'loket_id' => $loket?->id,
                        'status' => 'menunggu',
                        'waktu_daftar' => now(),
                        'jumlah_panggilan' => 0,
                        'petugas_id' => $request->user()?->id,
                    ]);
                });
            } catch (QueryException $e) {
                if ($attempt >= $maxAttempts || ! str_contains($e->getMessage(), 'Duplicate entry')) {
                    throw $e;
                }
                usleep(50000); // 50ms pause before retry
            }
        }

        $patientLabel = ! empty($antrean->nama_pasien) ? " ({$antrean->nama_pasien})" : '';

        return redirect()->back()->with([
            'success' => "Nomor antrean {$antrean->nomor} [{$loket?->nama}]{$patientLabel} berhasil diterbitkan!",
            'latest_antrean' => $antrean->load('loket'),
        ]);
    }

    /**
     * Print thermal receipt for an antrean.
     */
    public function cetak(Antrean $antrean)
    {
        $antrean->load('loket');
        $hospitalName = Pengaturan::get('nama_rumah_sakit', Pengaturan::get('hospital_name', 'RS PKU Muhammadiyah Sekapuk'));
        $unitName = Pengaturan::get('nama_unit', Pengaturan::get('unit_name', 'Instalasi Farmasi'));
        $formatNomor = Pengaturan::get('cetak_format_nomor', 'dash');
        $paperSize = Pengaturan::get('cetak_ukuran_kertas', '80mm');
        $jumlahLembar = (int) Pengaturan::get('cetak_jumlah_lembar', 1);
        $labelRangkap = Pengaturan::get('cetak_label_rangkap', '1') === '1';

        $nomorTampil = $formatNomor === 'dash'
            ? ($antrean->prefix.'-'.$antrean->nomor_urut)
            : $antrean->nomor;

        $waitingBefore = Antrean::whereDate('tanggal', $antrean->tanggal)
            ->where('prefix', $antrean->prefix)
            ->where('nomor_urut', '<', $antrean->nomor_urut)
            ->where('status', 'menunggu')
            ->count();

        return view('antrean.cetak', [
            'antrean' => $antrean,
            'hospitalName' => $hospitalName,
            'unitName' => $unitName,
            'nomorTampil' => $nomorTampil,
            'paperSize' => $paperSize,
            'waitingBefore' => $waitingBefore,
            'jumlahLembar' => $jumlahLembar,
            'labelRangkap' => $labelRangkap,
        ]);
    }

    /**
     * Remove / cancel an antrean.
     */
    public function destroy(Antrean $antrean): RedirectResponse
    {
        $antrean->update(['status' => 'batal']);

        return redirect()->back()->with('success', "Antrean nomor {$antrean->nomor} berhasil dibatalkan.");
    }
}
