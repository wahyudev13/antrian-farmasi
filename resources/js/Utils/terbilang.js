/**
 * Konversi angka integer ke terbilang bahasa Indonesia.
 * Contoh:
 * 1 -> satu
 * 10 -> sepuluh
 * 11 -> sebelas
 * 12 -> dua belas
 * 20 -> dua puluh
 * 21 -> dua puluh satu
 * 100 -> seratus
 * 105 -> seratus lima
 * 110 -> seratus sepuluh
 * 111 -> seratus sebelas
 * 200 -> dua ratus
 * 1000 -> seribu
 */
export function terbilang(n) {
    const angka = parseInt(n, 10);
    if (isNaN(angka)) return '';
    if (angka === 0) return 'nol';

    const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

    if (angka < 12) {
        return satuan[angka];
    } else if (angka < 20) {
        return terbilang(angka - 10) + ' belas';
    } else if (angka < 100) {
        const sisa = angka % 10;
        return terbilang(Math.floor(angka / 10)) + ' puluh' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
    } else if (angka < 200) {
        const sisa = angka - 100;
        return 'seratus' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
    } else if (angka < 1000) {
        const sisa = angka % 100;
        return terbilang(Math.floor(angka / 100)) + ' ratus' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
    } else if (angka < 2000) {
        const sisa = angka - 1000;
        return 'seribu' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
    } else if (angka < 1000000) {
        const sisa = angka % 1000;
        return terbilang(Math.floor(angka / 1000)) + ' ribu' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
    }
    return angka.toString();
}

/**
 * Format nomor antrean untuk Text-to-Speech (TTS) bahasa Indonesia.
 * Contoh:
 * "A001" -> "A, satu"
 * "A010" -> "A, sepuluh"
 * "A011" -> "A, sebelas"
 * "A012" -> "A, dua belas"
 * "A020" -> "A, dua puluh"
 * "A100" -> "A, seratus"
 * "10"   -> "sepuluh"
 * "11"   -> "sebelas"
 */
export function formatNomorSpeech(nomor) {
    if (!nomor) return '';
    const str = String(nomor).trim();

    // Pola umum: prefix (huruf/tanda) + angka (misal: "A001", "A-010", "B11", "10")
    const match = str.match(/^([A-Za-z\s-]+)?(\d+)$/);
    if (match) {
        const prefixRaw = match[1] || '';
        const digits = match[2];
        const prefixClean = prefixRaw.replace(/[-_]/g, ' ').trim();
        const terbilangStr = terbilang(parseInt(digits, 10));

        if (prefixClean) {
            return `${prefixClean}, ${terbilangStr}`;
        }
        return terbilangStr;
    }

    // Fallback: ganti setiap rangkaian digit dengan terbilang
    return str
        .replace(/\d+/g, (m) => ` ${terbilang(parseInt(m, 10))} `)
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Bersihkan nama pasien untuk pembacaan suara (TTS) agar tidak mengeja gelar SIMRS.
 * Contoh:
 * "PASIEN KAMAR INAP, TN" -> "PASIEN KAMAR INAP"
 * "SENAKRI, TN."          -> "SENAKRI"
 * "SITI FATIMAH, NY"      -> "SITI FATIMAH"
 * "ANISA, NN"             -> "ANISA"
 * "ALIF, AN"              -> "ALIF"
 * "BUDI SANTOSO, SDR"     -> "BUDI SANTOSO"
 */
export function cleanPatientNameForSpeech(name) {
    if (!name) return '';
    return String(name)
        .replace(/,\s*(TN|NY|NN|AN|BY|SDR|SDRI|TUAN|NYONYA|NONA|ANAK|BAYI)\.?\s*$/i, '')
        .replace(/\(\s*(TN|NY|NN|AN|BY|SDR|SDRI|TUAN|NYONYA|NONA|ANAK|BAYI)\.?\s*\)\s*$/i, '')
        .replace(/,\s*$/, '')
        .trim();
}
