<?php

namespace App\Http\Controllers;

use App\Models\Antrean;
use App\Models\Loket;
use App\Models\PanggilanPasien;
use App\Models\Pengaturan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanController extends Controller
{
    /**
     * Display a listing of reports and analytics.
     */
    public function index(Request $request): InertiaResponse
    {
        $filters = $this->extractFilters($request);

        $lokets = Loket::ordered()->get(['id', 'nama', 'prefix', 'nomor_display', 'warna', 'status']);

        if ($filters['jenis'] === 'pasien') {
            $data = $this->getPasienReportData($filters);
        } else {
            $data = $this->getAntreanReportData($filters);
        }

        return Inertia::render('Laporan/Index', [
            'filters' => $filters,
            'lokets' => $lokets,
            'stats' => $data['stats'],
            'loketStats' => $data['loketStats'],
            'reportData' => $data['records'],
        ]);
    }

    /**
     * Export reports data as CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $filters = $this->extractFilters($request);
        $filename = 'Laporan-Antrean-Farmasi-'.$filters['tanggal_mulai'].'-sd-'.$filters['tanggal_selesai'].'.csv';

        return response()->streamDownload(function () use ($filters) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            if ($filters['jenis'] === 'pasien') {
                fputcsv($handle, [
                    'No',
                    'Tanggal & Jam',
                    'Nama Pasien',
                    'No. RM',
                    'No. Rawat',
                    'Loket',
                    'Status',
                    'Waktu Panggil',
                    'Waktu Selesai',
                    'Durasi Layanan (Menit)',
                    'Jumlah Panggilan',
                    'Petugas',
                ]);

                $query = $this->buildPasienQuery($filters);
                $no = 1;

                $query->chunk(200, function ($records) use ($handle, &$no) {
                    foreach ($records as $row) {
                        $durasiLayanan = '-';
                        if ($row->waktu_panggil && $row->waktu_selesai) {
                            $durasiLayanan = round(Carbon::parse($row->waktu_panggil)->diffInSeconds(Carbon::parse($row->waktu_selesai)) / 60, 1);
                        }

                        fputcsv($handle, [
                            $no++,
                            $row->created_at?->format('Y-m-d H:i:s'),
                            $row->nama_pasien ?? '-',
                            $row->no_rkm_medis ?? '-',
                            $row->no_rawat ?? '-',
                            $row->loket?->nama ?? 'Loket Farmasi',
                            strtoupper($row->status),
                            $row->waktu_panggil?->format('H:i:s') ?? '-',
                            $row->waktu_selesai?->format('H:i:s') ?? '-',
                            $durasiLayanan,
                            $row->jumlah_panggilan ?? 0,
                            $row->petugas?->name ?? '-',
                        ]);
                    }
                });
            } else {
                fputcsv($handle, [
                    'No',
                    'Tanggal',
                    'Nomor Antrean',
                    'Loket',
                    'Nama Pasien',
                    'No. RM',
                    'Status',
                    'Waktu Daftar',
                    'Waktu Panggil',
                    'Waktu Selesai',
                    'Waktu Tunggu (Menit)',
                    'Durasi Layanan (Menit)',
                    'Jumlah Panggilan',
                    'Petugas',
                ]);

                $query = $this->buildAntreanQuery($filters);
                $no = 1;

                $query->chunk(200, function ($records) use ($handle, &$no) {
                    foreach ($records as $row) {
                        $waktuTunggu = '-';
                        if ($row->waktu_daftar && $row->waktu_panggil) {
                            $waktuTunggu = round(Carbon::parse($row->waktu_daftar)->diffInSeconds(Carbon::parse($row->waktu_panggil)) / 60, 1);
                        }

                        $durasiLayanan = '-';
                        if ($row->waktu_panggil && $row->waktu_selesai) {
                            $durasiLayanan = round(Carbon::parse($row->waktu_panggil)->diffInSeconds(Carbon::parse($row->waktu_selesai)) / 60, 1);
                        }

                        fputcsv($handle, [
                            $no++,
                            Carbon::parse($row->tanggal)->format('Y-m-d'),
                            $row->nomor,
                            $row->loket?->nama ?? ('Loket '.$row->prefix),
                            $row->nama_pasien ?? '-',
                            $row->no_rkm_medis ?? '-',
                            strtoupper($row->status),
                            $row->waktu_daftar?->format('H:i:s') ?? '-',
                            $row->waktu_panggil?->format('H:i:s') ?? '-',
                            $row->waktu_selesai?->format('H:i:s') ?? '-',
                            $waktuTunggu,
                            $durasiLayanan,
                            $row->jumlah_panggilan ?? 0,
                            $row->petugas?->name ?? '-',
                        ]);
                    }
                });
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Print report preview directly.
     */
    public function cetak(Request $request)
    {
        $filters = $this->extractFilters($request);

        $hospitalName = Pengaturan::get('nama_rumah_sakit', Pengaturan::get('hospital_name', 'RS PKU Muhammadiyah Sekapuk'));
        $unitName = Pengaturan::get('nama_unit', Pengaturan::get('unit_name', 'Instalasi Farmasi'));
        $alamatRS = Pengaturan::get('alamat_rumah_sakit', 'Jl. Raya Sekapuk No. 1, Ujungpangkah, Gresik');
        $teleponRS = Pengaturan::get('telepon_rumah_sakit', '(031) 3940123');

        if ($filters['jenis'] === 'pasien') {
            $data = $this->getPasienReportData($filters, true);
        } else {
            $data = $this->getAntreanReportData($filters, true);
        }

        return view('laporan.cetak', [
            'filters' => $filters,
            'hospitalName' => $hospitalName,
            'unitName' => $unitName,
            'alamatRS' => $alamatRS,
            'teleponRS' => $teleponRS,
            'stats' => $data['stats'],
            'loketStats' => $data['loketStats'],
            'records' => $data['records'],
            'user' => $request->user(),
        ]);
    }

    /**
     * Extract filter parameters with default values.
     *
     * @return array<string, mixed>
     */
    private function extractFilters(Request $request): array
    {
        $today = Carbon::today()->toDateString();

        return [
            'jenis' => in_array($request->input('jenis'), ['antrean', 'pasien'], true) ? $request->input('jenis') : 'antrean',
            'tanggal_mulai' => $request->input('tanggal_mulai') ?: $today,
            'tanggal_selesai' => $request->input('tanggal_selesai') ?: $today,
            'loket_id' => $request->filled('loket_id') ? (int) $request->input('loket_id') : null,
            'status' => $request->filled('status') ? $request->input('status') : null,
            'search' => $request->filled('search') ? trim((string) $request->input('search')) : null,
        ];
    }

    /**
     * Build base query for antrean tickets.
     */
    private function buildAntreanQuery(array $filters)
    {
        $query = Antrean::query()
            ->with(['loket:id,nama,prefix,nomor_display,warna', 'petugas:id,name'])
            ->whereBetween('tanggal', [$filters['tanggal_mulai'], $filters['tanggal_selesai']]);

        if (! empty($filters['loket_id'])) {
            $query->where('loket_id', $filters['loket_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nomor', 'like', "%{$search}%")
                    ->orWhere('nama_pasien', 'like', "%{$search}%")
                    ->orWhere('no_rkm_medis', 'like', "%{$search}%")
                    ->orWhere('no_rawat', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    /**
     * Get report data and statistics for ticket queue (Alur 1).
     *
     * @return array<string, mixed>
     */
    private function getAntreanReportData(array $filters, bool $forPrint = false): array
    {
        $baseQuery = $this->buildAntreanQuery($filters);

        // Stats calculation
        $total = (clone $baseQuery)->count();
        $selesai = (clone $baseQuery)->where('status', 'selesai')->count();
        $terlewat = (clone $baseQuery)->where('status', 'terlewat')->count();
        $menunggu = (clone $baseQuery)->where('status', 'menunggu')->count();
        $dipanggil = (clone $baseQuery)->whereIn('status', ['dipanggil', 'dilayani'])->count();

        // Calculate average wait time (daftar -> panggil)
        $avgWaitSeconds = (clone $baseQuery)
            ->whereNotNull('waktu_daftar')
            ->whereNotNull('waktu_panggil')
            ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, waktu_daftar, waktu_panggil)) as avg_seconds')
            ->value('avg_seconds');
        $avgWaitMinutes = $avgWaitSeconds ? round($avgWaitSeconds / 60, 1) : 0;

        // Calculate average service time (panggil -> selesai)
        $avgServiceSeconds = (clone $baseQuery)
            ->whereNotNull('waktu_panggil')
            ->whereNotNull('waktu_selesai')
            ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, waktu_panggil, waktu_selesai)) as avg_seconds')
            ->value('avg_seconds');
        $avgServiceMinutes = $avgServiceSeconds ? round($avgServiceSeconds / 60, 1) : 0;

        // Breakdown per loket
        $loketStats = (clone $baseQuery)
            ->select('loket_id', DB::raw('count(*) as count'))
            ->groupBy('loket_id')
            ->with('loket:id,nama,prefix,warna')
            ->get()
            ->map(function ($item) use ($total) {
                $pct = $total > 0 ? round(($item->count / $total) * 100, 1) : 0;

                return [
                    'loket_id' => $item->loket_id,
                    'nama' => $item->loket?->nama ?? 'Loket Khusus',
                    'prefix' => $item->loket?->prefix ?? '-',
                    'warna' => $item->loket?->warna ?? '#10b981',
                    'count' => $item->count,
                    'percentage' => $pct,
                ];
            });

        // Records list
        $recordsQuery = (clone $baseQuery)->orderBy('tanggal', 'desc')->orderBy('nomor_urut', 'desc');

        $records = $forPrint
            ? $recordsQuery->get()
            : $recordsQuery->paginate(25)->withQueryString();

        return [
            'stats' => [
                'total' => $total,
                'selesai' => $selesai,
                'terlewat' => $terlewat,
                'menunggu' => $menunggu,
                'dipanggil' => $dipanggil,
                'avgWaitMinutes' => $avgWaitMinutes,
                'avgServiceMinutes' => $avgServiceMinutes,
            ],
            'loketStats' => $loketStats,
            'records' => $records,
        ];
    }

    /**
     * Build base query for SIMRS patient calls.
     */
    private function buildPasienQuery(array $filters)
    {
        $startDate = Carbon::parse($filters['tanggal_mulai'])->startOfDay();
        $endDate = Carbon::parse($filters['tanggal_selesai'])->endOfDay();

        $query = PanggilanPasien::query()
            ->with(['loket:id,nama,prefix,nomor_display,warna', 'petugas:id,name'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if (! empty($filters['loket_id'])) {
            $query->where('loket_id', $filters['loket_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nama_pasien', 'like', "%{$search}%")
                    ->orWhere('no_rkm_medis', 'like', "%{$search}%")
                    ->orWhere('no_rawat', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    /**
     * Get report data and statistics for SIMRS patient calls (Alur 2).
     *
     * @return array<string, mixed>
     */
    private function getPasienReportData(array $filters, bool $forPrint = false): array
    {
        $baseQuery = $this->buildPasienQuery($filters);

        $total = (clone $baseQuery)->count();
        $selesai = (clone $baseQuery)->where('status', 'selesai')->count();
        $menunggu = (clone $baseQuery)->where('status', 'menunggu')->count();
        $dipanggil = (clone $baseQuery)->whereIn('status', ['dipanggil', 'dilayani'])->count();

        // Calculate average service time (panggil -> selesai)
        $avgServiceSeconds = (clone $baseQuery)
            ->whereNotNull('waktu_panggil')
            ->whereNotNull('waktu_selesai')
            ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, waktu_panggil, waktu_selesai)) as avg_seconds')
            ->value('avg_seconds');
        $avgServiceMinutes = $avgServiceSeconds ? round($avgServiceSeconds / 60, 1) : 0;

        $loketStats = (clone $baseQuery)
            ->select('loket_id', DB::raw('count(*) as count'))
            ->groupBy('loket_id')
            ->with('loket:id,nama,prefix,warna')
            ->get()
            ->map(function ($item) use ($total) {
                $pct = $total > 0 ? round(($item->count / $total) * 100, 1) : 0;

                return [
                    'loket_id' => $item->loket_id,
                    'nama' => $item->loket?->nama ?? 'Loket Farmasi',
                    'prefix' => $item->loket?->prefix ?? '-',
                    'warna' => $item->loket?->warna ?? '#10b981',
                    'count' => $item->count,
                    'percentage' => $pct,
                ];
            });

        $recordsQuery = (clone $baseQuery)->latest('id');

        $records = $forPrint
            ? $recordsQuery->get()
            : $recordsQuery->paginate(25)->withQueryString();

        return [
            'stats' => [
                'total' => $total,
                'selesai' => $selesai,
                'terlewat' => 0,
                'menunggu' => $menunggu,
                'dipanggil' => $dipanggil,
                'avgWaitMinutes' => 0,
                'avgServiceMinutes' => $avgServiceMinutes,
            ],
            'loketStats' => $loketStats,
            'records' => $records,
        ];
    }
}
