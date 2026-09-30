<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karcis Antrean {{ $nomorTampil }} - {{ $hospitalName }}</title>
    <style>
        /* Force browser to Portrait and zero out default print margins */
        @page {
            size: {{ $paperSize === '58mm' ? '58mm' : '80mm' }} auto;
            margin: 0;
        }
        @page :left {
            margin: 0;
        }
        @page :right {
            margin: 0;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            background-color: #e2e8f0;
            color: #000;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 10px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .no-print-bar {
            margin-bottom: 16px;
            display: flex;
            gap: 10px;
        }

        .btn {
            cursor: pointer;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: bold;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .btn-primary {
            background-color: #059669;
            color: #fff;
        }

        .btn-secondary {
            background-color: #475569;
            color: #fff;
        }

        /* Thermal Ticket Container */
        .ticket-card {
            width: {{ $paperSize === '58mm' ? '54mm' : '74mm' }};
            background: #fff;
            padding: 12px 8px;
            text-align: center;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .title-header {
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.2;
        }

        .category-name {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            margin-top: 2px;
            line-height: 1.2;
        }

        .hospital-name {
            font-size: 11px;
            font-weight: 500;
            color: #1e293b;
            margin-top: 3px;
            line-height: 1.2;
        }

        .number-box {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            margin: 10px 0;
            padding: 6px 0;
        }

        .number-text {
            font-size: 46px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: 2px;
            font-family: 'Arial Black', Impact, 'Arial', sans-serif;
        }

        .date-text {
            font-size: 11px;
            font-weight: 600;
            color: #334155;
            margin-top: 2px;
        }

        .patient-info {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 4px;
        }

        .queue-waiting {
            font-size: 10px;
            color: #64748b;
            margin-top: 4px;
        }

        .copy-label {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #000;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #475569;
            text-transform: uppercase;
        }

        .page-break {
            page-break-after: always;
            break-after: page;
        }

        @media print {
            body {
                background: #fff !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                display: block !important;
                gap: 0 !important;
            }

            .no-print-bar {
                display: none !important;
            }

            .ticket-card {
                width: 100% !important;
                max-width: {{ $paperSize === '58mm' ? '54mm' : '76mm' }} !important;
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                margin: 0 auto !important;
                padding: 4mm 2mm !important;
            }

            .page-break {
                page-break-after: always !important;
                break-after: page !important;
            }

            .number-text {
                font-size: 44px !important;
            }
        }
    </style>
</head>
<body>
    <div class="no-print-bar">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Cetak Karcis Sekarang</button>
        <button class="btn btn-secondary" onclick="window.close()">✕ Tutup</button>
    </div>

    @php
        $jumlahLembar = max(1, (int) ($jumlahLembar ?? 1));
        $labelRangkap = $labelRangkap ?? true;
    @endphp

    @for ($i = 1; $i <= $jumlahLembar; $i++)
        <div class="ticket-card {{ $i < $jumlahLembar ? 'page-break' : '' }}">
            <div class="title-header">NOMOR ANTRIAN FARMASI</div>
            <div class="category-name">{{ $antrean->loket?->nama ?? 'OBAT NON RACIKAN' }}</div>
            <div class="hospital-name">{{ $hospitalName }}</div>

            <div class="number-box">
                <div class="number-text">{{ $nomorTampil }}</div>
            </div>

            @if(!empty($antrean->nama_pasien))
                <div class="patient-info">PASIEN: {{ $antrean->nama_pasien }}</div>
            @endif

            <div class="date-text">
                {{ \Carbon\Carbon::parse($antrean->waktu_daftar ?? $antrean->tanggal)->locale('id')->translatedFormat('l, d F Y') }}
            </div>

            @if($jumlahLembar > 1 && $labelRangkap)
                <div class="copy-label">
                    {{ $i === 1 ? '• LEMBAR PASIEN •' : ($i === 2 ? '• LEMBAR RESEP / PETUGAS •' : "• LEMBAR SALINAN {$i} •") }}
                </div>
            @endif
        </div>
    @endfor

    <script>
        window.addEventListener('DOMContentLoaded', () => {
            // Auto open print dialog only if opened as a standalone window (not in iframe or embedded)
            let isStandalone = false;
            try {
                isStandalone = (window.self === window.top);
            } catch (e) {
                isStandalone = false;
            }

            if (window.location.search.includes('embedded=1') || window.frameElement) {
                isStandalone = false;
            }

            if (isStandalone) {
                setTimeout(() => {
                    window.print();
                }, 300);
            }
        });
    </script>
</body>
</html>
