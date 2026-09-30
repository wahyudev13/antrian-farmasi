<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class KhanzaPatientService
{
    /**
     * Test if connection to SIMRS Khanza database is active.
     */
    public function isConnectionReachable(): bool
    {
        try {
            DB::connection('khanza')->getPdo();

            return true;
        } catch (Exception $e) {
            Log::warning('Koneksi database SIMRS Khanza belum aktif / belum terkonfigurasi: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Get list of active polikliniks.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getPoliklinikList(): array
    {
        if (! $this->isConnectionReachable()) {
            return [];
        }

        try {
            return DB::connection('khanza')
                ->table('poliklinik')
                ->where('status', '1')
                ->select(['kd_poli', 'nm_poli'])
                ->orderBy('nm_poli')
                ->get()
                ->map(fn ($p) => (array) $p)
                ->toArray();
        } catch (Exception $e) {
            Log::error('Error fetching poliklinik list: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Get list of active doctors.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getDokterList(): array
    {
        if (! $this->isConnectionReachable()) {
            return [];
        }

        try {
            return DB::connection('khanza')
                ->table('dokter')
                ->where('status', '1')
                ->select(['kd_dokter', 'nm_dokter'])
                ->orderBy('nm_dokter')
                ->get()
                ->map(fn ($d) => (array) $d)
                ->toArray();
        } catch (Exception $e) {
            Log::error('Error fetching dokter list: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Get registered patients from SIMRS Khanza reg_periksa table.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getRegisteredPatients(
        ?string $tanggal = null,
        ?string $search = null,
        ?string $kdPoli = null,
        ?string $kdDokter = null,
        int $limit = 100
    ): array {
        if (! $this->isConnectionReachable()) {
            return [];
        }

        try {
            $query = DB::connection('khanza')
                ->table('reg_periksa')
                ->join('pasien', 'reg_periksa.no_rkm_medis', '=', 'pasien.no_rkm_medis')
                ->leftJoin('poliklinik', 'reg_periksa.kd_poli', '=', 'poliklinik.kd_poli')
                ->leftJoin('dokter', 'reg_periksa.kd_dokter', '=', 'dokter.kd_dokter')
                ->select([
                    'reg_periksa.no_rawat',
                    'reg_periksa.no_rkm_medis',
                    'pasien.nm_pasien',
                    'pasien.jk',
                    'reg_periksa.kd_poli',
                    'poliklinik.nm_poli',
                    'reg_periksa.kd_dokter',
                    'dokter.nm_dokter',
                    'reg_periksa.tgl_registrasi',
                    'reg_periksa.jam_reg',
                    'reg_periksa.stts',
                    'reg_periksa.status_lanjut',
                ]);

            if ($tanggal) {
                $query->where('reg_periksa.tgl_registrasi', $tanggal);
            }

            if ($kdPoli) {
                $query->where('reg_periksa.kd_poli', $kdPoli);
            }

            if ($kdDokter) {
                $query->where('reg_periksa.kd_dokter', $kdDokter);
            }

            if ($search) {
                $search = trim($search);
                $query->where(function ($q) use ($search) {
                    $q->where('pasien.nm_pasien', 'like', "%{$search}%")
                        ->orWhere('reg_periksa.no_rkm_medis', 'like', "%{$search}%")
                        ->orWhere('reg_periksa.no_rawat', 'like', "%{$search}%");
                });
            }

            $results = $query
                ->orderBy('reg_periksa.tgl_registrasi', 'desc')
                ->orderBy('reg_periksa.jam_reg', 'desc')
                ->take($limit)
                ->get();

            return $results->map(function ($item) {
                return (array) $item;
            })->toArray();
        } catch (Exception $e) {
            Log::error('Error fetching registered patients from Khanza: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Search patient in SIMRS Khanza by keyword (No RM / Nama / No Rawat).
     *
     * @return array<int, array<string, mixed>>
     */
    public function searchPatient(string $keyword, int $limit = 25): array
    {
        $keyword = trim($keyword);
        if (empty($keyword)) {
            return [];
        }

        return $this->getRegisteredPatients(null, $keyword, null, null, $limit);
    }

    /**
     * Find patient details by No Rawat.
     *
     * @return array<string, mixed>|null
     */
    public function findPatientByNoRawat(string $noRawat): ?array
    {
        if (! $this->isConnectionReachable()) {
            return null;
        }

        try {
            $patient = DB::connection('khanza')
                ->table('reg_periksa')
                ->join('pasien', 'reg_periksa.no_rkm_medis', '=', 'pasien.no_rkm_medis')
                ->leftJoin('poliklinik', 'reg_periksa.kd_poli', '=', 'poliklinik.kd_poli')
                ->leftJoin('dokter', 'reg_periksa.kd_dokter', '=', 'dokter.kd_dokter')
                ->where('reg_periksa.no_rawat', $noRawat)
                ->select([
                    'reg_periksa.no_rawat',
                    'reg_periksa.no_rkm_medis',
                    'pasien.nm_pasien',
                    'pasien.jk',
                    'reg_periksa.kd_poli',
                    'poliklinik.nm_poli',
                    'reg_periksa.kd_dokter',
                    'dokter.nm_dokter',
                    'reg_periksa.tgl_registrasi',
                    'reg_periksa.jam_reg',
                ])
                ->first();

            return $patient ? (array) $patient : null;
        } catch (Exception $e) {
            Log::error('Error pencarian no rawat di Khanza: '.$e->getMessage());

            return null;
        }
    }
}
