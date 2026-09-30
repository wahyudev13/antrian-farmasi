<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Rekapitulasi Antrean Farmasi - {{ $hospitalName }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 15mm 10mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #1e293b;
            background-color: #f8fafc;
            padding: 15px;
        }

        .no-print-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 10px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .btn {
            cursor: pointer;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .btn-primary {
            background-color: #059669;
            color: #fff;
        }

        .btn-secondary {
            background-color: #64748b;
            color: #fff;
        }

        .paper-container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Kop Surat */
        .header-kop {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }

        .header-kop-left {
            text-align: left;
        }

        .header-kop-left h1 {
            font-size: 16px;
            font-weight: 800;
            color: #047857;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .header-kop-left h2 {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 2px;
        }

        .header-kop-left p {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
        }

        .header-kop-right {
            text-align: right;
            font-size: 10px;
            color: #475569;
        }

        /* Title */
        .report-title-box {
            text-align: center;
            margin-bottom: 16px;
        }

        .report-title-box h3 {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
        }

        .report-title-box p {
            font-size: 11px;
            color: #475569;
            margin-top: 3px;
        }

        /* Stats Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 16px;
        }

        .stat-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            text-align: center;
        }

        .stat-card .label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
        }

        .stat-card .value {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            font-family: monospace;
            margin-top: 2px;
        }

        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 20px;
        }

        th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
        }

        th {
            background-color: #f1f5f9;
            color: #1e293b;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.3px;
        }

        tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .badge-selesai { background-color: #dcfce7; color: #166534; }
        .badge-terlewat { background-color: #fef3c7; color: #92400e; }
        .badge-menunggu { background-color: #e0f2fe; color: #075985; }
        .badge-dipanggil { background-color: #f3e8ff; color: #6b21a8; }
        .badge-batal { background-color: #ffe4e6; color: #9f1239; }

        /* Signatures */
        .signature-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
        }

        .signature-box {
            text-align: center;
            width: 220px;
        }

        .signature-box .date-line {
            font-size: 10px;
            margin-bottom: 50px;
        }

        .signature-box .name-line {
            font-weight: bold;
            text-decoration: underline;
            font-size: 11px;
        }

        .signature-box .role-line {
            font-size: 10px;
            color: #64748b;
        }

        @media print {
            body {
                background-color: #ffffff;
                padding: 0;
            }

            .no-print-bar {
                display: none !important;
            }

            .paper-container {
                border: none;
                padding: 0;
                box-shadow: none;
                max-width: 100%;
            }

            table {
                font-size: 9px;
            }

            th, td {
                padding: 4px 6px;
            }
        }
    </style>
</head>
<body>
    <div class="no-print-bar">
        <div>
            <strong>Pratinjau Cetak Laporan Antrean Farmasi</strong>
            <span style="color: #64748b; font-size: 11px; margin-left: 8px;">Gunakan orientasi Landscape untuk hasil terbaik.</span>
        </div>
        <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
            <button class="btn btn-secondary" onclick="window.close()">✕ Tutup</button>
        </div>
    </div>

    <div class="paper-container">
        <!-- Kop Surat -->
        <div class="header-kop">
            <div class="header-kop-left">
                <h1>{{ $hospitalName }}</h1>
                <h2>{{ $unitName }}</h2>
                <p>{{ $alamatRS }} &bull; Telp: {{ $teleponRS }}</p>
            </div>
            <div class="header-kop-right">
                <div>Tanggal Cetak: <strong>{{ \Carbon\Carbon::now()->translatedFormat('d F Y, H:i') }} WIB</strong></div>
                <div>Dicetak Oleh: <strong>{{ $user?->name ?? 'Administrator' }}</strong></div>
            </div>
        </div>

        <!-- Title & Filter Info -->
        <div class="report-title-box">
            <h3>Laporan Rekapitulasi Pelayanan Antrean Farmasi</h3>
            <p>
                Periode: <strong>{{ \Carbon\Carbon::parse($filters['tanggal_mulai'])->translatedFormat('d F Y') }}</strong> s/d <strong>{{ \Carbon\Carbon::parse($filters['tanggal_selesai'])->translatedFormat('d F Y') }}</strong>
                &bull; Kategori Alur: <strong>{{ $filters['jenis'] === 'pasien' ? 'Pemanggilan Pasien SIMRS' : 'Karcis Antrean Farmasi' }}</strong>
                @if(!empty($filters['status']))
                    &bull; Status: <strong>{{ strtoupper($filters['status']) }}</strong>
                @endif
            </p>
        </div>

        <!-- Stats Overview -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="label">Total Antrean</div>
                <div class="value">{{ number_format($stats['total']) }}</div>
            </div>
            <div class="stat-card">
                <div class="label">Selesai Dilayani</div>
                <div class="value" style="color: #16a34a;">{{ number_format($stats['selesai']) }}</div>
            </div>
            <div class="stat-card">
                <div class="label">Terlewat</div>
                <div class="value" style="color: #d97706;">{{ number_format($stats['terlewat']) }}</div>
            </div>
            <div class="stat-card">
                <div class="label">Rata Tunggu</div>
                <div class="value">{{ $stats['avgWaitMinutes'] }} mnt</div>
            </div>
            <div class="stat-card">
                <div class="label">Rata Layanan</div>
                <div class="value">{{ $stats['avgServiceMinutes'] }} mnt</div>
            </div>
        </div>

        <!-- Table Data -->
        <table>
            <thead>
                @if($filters['jenis'] === 'pasien')
                    <tr>
                        <th style="width: 30px; text-align: center;">No</th>
                        <th>Waktu Panggil</th>
                        <th>Nama Pasien</th>
                        <th>No. RM</th>
                        <th>No. Rawat</th>
                        <th>Loket</th>
                        <th style="text-align: center;">Status</th>
                        <th>Waktu Selesai</th>
                        <th style="text-align: right;">Durasi Layanan</th>
                        <th style="text-align: center;">Panggilan</th>
                        <th>Petugas</th>
                    </tr>
                @else
                    <tr>
                        <th style="width: 30px; text-align: center;">No</th>
                        <th>Tanggal</th>
                        <th>Nomor</th>
                        <th>Loket</th>
                        <th>Nama Pasien</th>
                        <th>No. RM</th>
                        <th style="text-align: center;">Status</th>
                        <th>Waktu Daftar</th>
                        <th>Waktu Panggil</th>
                        <th>Waktu Selesai</th>
                        <th style="text-align: right;">Waktu Tunggu</th>
                        <th style="text-align: right;">Layanan</th>
                        <th>Petugas</th>
                    </tr>
                @endif
            </thead>
            <tbody>
                @forelse($records as $index => $row)
                    @if($filters['jenis'] === 'pasien')
                        @php
                            $durasiLayanan = '-';
                            if ($row->waktu_panggil && $row->waktu_selesai) {
                                $durasiLayanan = round(\Carbon\Carbon::parse($row->waktu_panggil)->diffInSeconds(\Carbon\Carbon::parse($row->waktu_selesai)) / 60, 1) . ' mnt';
                            }
                        @endphp
                        <tr>
                            <td style="text-align: center;">{{ $index + 1 }}</td>
                            <td>{{ $row->waktu_panggil ? $row->waktu_panggil->format('d/m/Y H:i') : '-' }}</td>
                            <td><strong>{{ $row->nama_pasien ?? '-' }}</strong></td>
                            <td style="font-family: monospace;">{{ $row->no_rkm_medis ?? '-' }}</td>
                            <td style="font-family: monospace;">{{ $row->no_rawat ?? '-' }}</td>
                            <td>{{ $row->loket?->nama ?? 'Loket Farmasi' }}</td>
                            <td style="text-align: center;">
                                <span class="badge badge-{{ $row->status }}">{{ $row->status }}</span>
                            </td>
                            <td>{{ $row->waktu_selesai ? $row->waktu_selesai->format('H:i:s') : '-' }}</td>
                            <td style="text-align: right; font-family: monospace;">{{ $durasiLayanan }}</td>
                            <td style="text-align: center;">{{ $row->jumlah_panggilan }}x</td>
                            <td>{{ $row->petugas?->name ?? '-' }}</td>
                        </tr>
                    @else
                        @php
                            $waktuTunggu = '-';
                            if ($row->waktu_daftar && $row->waktu_panggil) {
                                $waktuTunggu = round(\Carbon\Carbon::parse($row->waktu_daftar)->diffInSeconds(\Carbon\Carbon::parse($row->waktu_panggil)) / 60, 1) . ' mnt';
                            }
                            $durasiLayanan = '-';
                            if ($row->waktu_panggil && $row->waktu_selesai) {
                                $durasiLayanan = round(\Carbon\Carbon::parse($row->waktu_panggil)->diffInSeconds(\Carbon\Carbon::parse($row->waktu_selesai)) / 60, 1) . ' mnt';
                            }
                        @endphp
                        <tr>
                            <td style="text-align: center;">{{ $index + 1 }}</td>
                            <td>{{ \Carbon\Carbon::parse($row->tanggal)->format('d/m/Y') }}</td>
                            <td style="font-family: monospace; font-weight: bold;">{{ $row->nomor }}</td>
                            <td>{{ $row->loket?->nama ?? ('Loket ' . $row->prefix) }}</td>
                            <td><strong>{{ $row->nama_pasien ?? '-' }}</strong></td>
                            <td style="font-family: monospace;">{{ $row->no_rkm_medis ?? '-' }}</td>
                            <td style="text-align: center;">
                                <span class="badge badge-{{ $row->status }}">{{ $row->status }}</span>
                            </td>
                            <td>{{ $row->waktu_daftar ? $row->waktu_daftar->format('H:i:s') : '-' }}</td>
                            <td>{{ $row->waktu_panggil ? $row->waktu_panggil->format('H:i:s') : '-' }}</td>
                            <td>{{ $row->waktu_selesai ? $row->waktu_selesai->format('H:i:s') : '-' }}</td>
                            <td style="text-align: right; font-family: monospace;">{{ $waktuTunggu }}</td>
                            <td style="text-align: right; font-family: monospace;">{{ $durasiLayanan }}</td>
                            <td>{{ $row->petugas?->name ?? '-' }}</td>
                        </tr>
                    @endif
                @empty
                    <tr>
                        <td colspan="{{ $filters['jenis'] === 'pasien' ? 11 : 13 }}" style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic;">
                            Tidak ada data antrean pada periode dan filter yang dipilih.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Signatures -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="date-line">Petugas Farmasi,</div>
                <div class="name-line">{{ $user?->name ?? 'Petugas Farmasi' }}</div>
                <div class="role-line">Pelaksana Pelayanan</div>
            </div>

            <div class="signature-box">
                <div class="date-line">Sekapuk, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}<br>Mengetahui,</div>
                <div class="name-line">Penanggung Jawab Farmasi</div>
                <div class="role-line">RS PKU Muhammadiyah Sekapuk</div>
            </div>
        </div>
    </div>

    <script>
        window.addEventListener('DOMContentLoaded', () => {
            if (window.self === window.top) {
                setTimeout(() => {
                    window.print();
                }, 400);
            }
        });
    </script>
</body>
</html>
