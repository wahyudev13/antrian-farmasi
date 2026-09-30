import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import HospitalLayout from '@/Layouts/HospitalLayout';
import {
    Settings,
    UploadCloud,
    Trash2,
    Building2,
    Eye,
    Shield,
    Hash,
    Save,
    Image as ImageIcon,
    RefreshCw,
    Info,
    Volume2,
    Printer,
    Sparkles,
    Play
} from 'lucide-react';
import { formatNomorSpeech } from '@/Utils/terbilang';

export default function PengaturanIndex({ settings, logoUrl }) {
    const [previewUrl, setPreviewUrl] = useState(logoUrl);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'POST',
        nama_rumah_sakit: settings?.nama_rumah_sakit || '',
        nama_unit: settings?.nama_unit || '',
        alamat_rs: settings?.alamat_rs || '',
        running_text: settings?.running_text || '',
        queue_prefix: settings?.queue_prefix || 'A',
        queue_padding: settings?.queue_padding || '3',
        daily_reset: settings?.daily_reset || '1',
        display_privacy_mode: settings?.display_privacy_mode || 'masked',
        template_suara_antrean: settings?.template_suara_antrean || 'Nomor antrean, {nomor}, silakan menuju {loket}',
        template_suara_pasien: settings?.template_suara_pasien || 'Pasien atas nama, {nama}, silakan menuju {loket}',
        tts_kecepatan: settings?.tts_kecepatan || '0.9',
        tts_nada: settings?.tts_nada || '1.0',
        tts_volume: settings?.tts_volume || '1.0',
        cetak_ukuran_kertas: settings?.cetak_ukuran_kertas || '80mm',
        cetak_format_nomor: settings?.cetak_format_nomor || 'dash',
        cetak_jumlah_lembar: settings?.cetak_jumlah_lembar || '1',
        cetak_label_rangkap: settings?.cetak_label_rangkap || '1',
        logo_file: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo_file', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleHapusLogo = () => {
        if (confirm('Apakah Anda yakin ingin menghapus logo rumah sakit?')) {
            router.delete(route('pengaturan.destroy-logo'), {
                onSuccess: () => {
                    setPreviewUrl(null);
                    setData('logo_file', null);
                },
            });
        }
    };

    const testSpeech = (type = 'antrean') => {
        if (!('speechSynthesis' in window)) {
            alert('Browser Anda tidak mendukung Web Speech API.');
            return;
        }
        window.speechSynthesis.cancel();

        let text = '';
        if (type === 'antrean') {
            text = (data.template_suara_antrean || 'Nomor antrean, {nomor}, silakan menuju {loket}')
                .replace('{nomor}', formatNomorSpeech('A010'))
                .replace('{loket}', 'Loket 1 Non Racikan')
                .replace('{nama}', 'Ahmad');
        } else {
            text = (data.template_suara_pasien || 'Pasien atas nama, {nama}, silakan menuju {loket}')
                .replace('{nama}', 'Ahmad Subagyo')
                .replace('{loket}', 'Loket 1 Non Racikan');
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = parseFloat(data.tts_kecepatan) || 0.9;
        utterance.pitch = parseFloat(data.tts_nada) || 1.0;
        utterance.volume = parseFloat(data.tts_volume) || 1.0;

        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID'));
        if (idVoice) {
            utterance.voice = idVoice;
        }

        window.speechSynthesis.speak(utterance);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('pengaturan.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const sampleNomor = data.cetak_format_nomor === 'dash' ? 'A-56' : 'A056';

    return (
        <HospitalLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                            <Settings className="w-4 h-4" />
                            <span>Master Data</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Pengaturan Sistem & Suara Pemanggilan
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Sesuaikan template suara pemanggilan, format cetakan karcis thermal, identitas RS, dan tampilan antrean.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Pengaturan & Suara" />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Pengaturan Suara Pemanggilan (TTS Text Template & Slider) */}
                <div className="bg-white rounded-2xl border-2 border-emerald-500/30 shadow-xs p-5 sm:p-6 space-y-6">
                    <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <Volume2 className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-slate-900 text-base">
                                    Pengaturan Teks & Suara Pemanggilan (Text-To-Speech)
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Sesuaikan kalimat pemanggilan otomatis dan nada suara saat memanggil nomor karcis atau nama pasien.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => testSpeech('antrean')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition shadow-2xs"
                            >
                                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                                <span>Tes Suara Antrean</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => testSpeech('pasien')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition shadow-2xs"
                            >
                                <Play className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                                <span>Tes Suara Pasien</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Template Suara Antrean Karcis */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Template Suara Nomor Antrean
                            </label>
                            <input
                                type="text"
                                value={data.template_suara_antrean}
                                onChange={(e) => setData('template_suara_antrean', e.target.value)}
                                placeholder="Nomor antrean, {nomor}, silakan menuju {loket}"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-sm font-medium"
                            />
                            <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <strong>Tag Tersedia:</strong> <code className="text-emerald-700 bg-white px-1 py-0.5 rounded border border-slate-200">{"{nomor}"}</code> (nomor antrean), <code className="text-emerald-700 bg-white px-1 py-0.5 rounded border border-slate-200">{"{loket}"}</code> (nama loket), <code className="text-emerald-700 bg-white px-1 py-0.5 rounded border border-slate-200">{"{nama}"}</code> (nama pasien jika ada).
                            </div>
                            {errors.template_suara_antrean && (
                                <p className="text-xs text-rose-600">{errors.template_suara_antrean}</p>
                            )}
                        </div>

                        {/* Template Suara Pasien Langsung */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Template Suara Panggilan Pasien
                            </label>
                            <input
                                type="text"
                                value={data.template_suara_pasien}
                                onChange={(e) => setData('template_suara_pasien', e.target.value)}
                                placeholder="Pasien atas nama, {nama}, silakan menuju {loket}"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-sm font-medium"
                            />
                            <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <strong>Tag Tersedia:</strong> <code className="text-purple-700 bg-white px-1 py-0.5 rounded border border-slate-200">{"{nama}"}</code> (nama lengkap pasien), <code className="text-purple-700 bg-white px-1 py-0.5 rounded border border-slate-200">{"{loket}"}</code> (nama loket tujuan).
                            </div>
                            {errors.template_suara_pasien && (
                                <p className="text-xs text-rose-600">{errors.template_suara_pasien}</p>
                            )}
                        </div>
                    </div>

                    {/* Speed, Pitch, Volume Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">
                                    Kecepatan Bicara (Rate)
                                </label>
                                <span className="text-xs font-mono font-bold text-emerald-700">
                                    {data.tts_kecepatan}x
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="1.5"
                                step="0.05"
                                value={data.tts_kecepatan}
                                onChange={(e) => setData('tts_kecepatan', e.target.value)}
                                className="w-full accent-emerald-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>Lambat (0.5x)</span>
                                <span>Normal (1.0x)</span>
                                <span>Cepat (1.5x)</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">
                                    Nada Suara (Pitch)
                                </label>
                                <span className="text-xs font-mono font-bold text-emerald-700">
                                    {data.tts_nada}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="1.5"
                                step="0.05"
                                value={data.tts_nada}
                                onChange={(e) => setData('tts_nada', e.target.value)}
                                className="w-full accent-emerald-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>Berat (0.5)</span>
                                <span>Standar (1.0)</span>
                                <span>Tinggi (1.5)</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">
                                    Volume Suara
                                </label>
                                <span className="text-xs font-mono font-bold text-emerald-700">
                                    {Math.round(parseFloat(data.tts_volume) * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.05"
                                value={data.tts_volume}
                                onChange={(e) => setData('tts_volume', e.target.value)}
                                className="w-full accent-emerald-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>Pelan (10%)</span>
                                <span>Maksimal (100%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Pengaturan Format Cetakan Karcis Thermal */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <Printer className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-slate-900 text-base">
                                Format Cetakan Karcis Tiket Antrean (Printer Thermal)
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Atur tata letak dan ukuran kertas struk karcis untuk diserahkan ke pasien (kompatibel printer thermal Epson / POS).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Settings inputs */}
                        <div className="lg:col-span-7 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Format Penulisan Nomor Karcis
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition ${
                                            data.cetak_format_nomor === 'dash'
                                                ? 'border-emerald-600 bg-emerald-50/50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="cetak_format_nomor"
                                                value="dash"
                                                checked={data.cetak_format_nomor === 'dash'}
                                                onChange={(e) => setData('cetak_format_nomor', e.target.value)}
                                                className="text-emerald-600 focus:ring-0"
                                            />
                                            <span className="font-bold text-sm text-slate-800">Format Strip (A-56)</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1.5">
                                            Menampilkan strip pemisah (contoh: <strong>A-56</strong>, <strong>B-12</strong>)
                                        </p>
                                    </label>

                                    <label
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition ${
                                            data.cetak_format_nomor === 'standard'
                                                ? 'border-emerald-600 bg-emerald-50/50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="cetak_format_nomor"
                                                value="standard"
                                                checked={data.cetak_format_nomor === 'standard'}
                                                onChange={(e) => setData('cetak_format_nomor', e.target.value)}
                                                className="text-emerald-600 focus:ring-0"
                                            />
                                            <span className="font-bold text-sm text-slate-800">Format Penuh (A056)</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1.5">
                                            Format digit angka standar (contoh: <strong>A001</strong>, <strong>A056</strong>)
                                        </p>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Lebar Kertas Thermal Printer
                                </label>
                                <select
                                    value={data.cetak_ukuran_kertas}
                                    onChange={(e) => setData('cetak_ukuran_kertas', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-sm font-medium"
                                >
                                    <option value="80mm">Standar POS 80mm (Ukuran Epson TM-T82 / Thermal 80mm)</option>
                                    <option value="58mm">Standar Mini POS 58mm (Printer Kasir / Thermal 58mm)</option>
                                </select>
                                <span className="text-[11px] text-slate-400 block mt-1">
                                    Halaman cetak akan otomatis terkunci ke orientasi <strong>Portrait</strong> dan menyesuaikan lebar kertas.
                                </span>
                            </div>

                            {/* Jumlah Lembar / Halaman Cetak per Karcis */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Jumlah Halaman / Lembar Cetak Karcis
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition ${
                                            data.cetak_jumlah_lembar === '1'
                                                ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="cetak_jumlah_lembar"
                                                value="1"
                                                checked={data.cetak_jumlah_lembar === '1'}
                                                onChange={(e) => setData('cetak_jumlah_lembar', e.target.value)}
                                                className="text-emerald-600 focus:ring-0"
                                            />
                                            <span className="font-bold text-sm text-slate-800">1 Lembar (Standar)</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                                            1x klik tombol Ambil Karcis hanya mencetak <strong>1 lembar</strong> struk antrean.
                                        </p>
                                    </label>

                                    <label
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition ${
                                            data.cetak_jumlah_lembar === '2'
                                                ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="cetak_jumlah_lembar"
                                                value="2"
                                                checked={data.cetak_jumlah_lembar === '2'}
                                                onChange={(e) => setData('cetak_jumlah_lembar', e.target.value)}
                                                className="text-emerald-600 focus:ring-0"
                                            />
                                            <span className="font-bold text-sm text-slate-800">2 Lembar (Beda Halaman)</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                                            1x klik langsung cetak <strong>2 nomor antrean di halaman terpisah</strong> (1 untuk pasien, 1 untuk resep/arsip).
                                        </p>
                                    </label>
                                </div>
                            </div>

                            {/* Label Keterangan Salinan (jika > 1 lembar) */}
                            {data.cetak_jumlah_lembar > '1' && (
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Keterangan Teks Pada Lembar Cetak
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <label
                                            className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs font-medium transition ${
                                                data.cetak_label_rangkap === '1'
                                                    ? 'bg-white border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                                                    : 'border-slate-200 text-slate-600 hover:bg-white'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="cetak_label_rangkap"
                                                value="1"
                                                checked={data.cetak_label_rangkap === '1'}
                                                onChange={(e) => setData('cetak_label_rangkap', e.target.value)}
                                                className="text-emerald-600 focus:ring-0"
                                            />
                                            <span>Beri Label [PASIEN] & [RESEP]</span>
                                        </label>

                                        <label
                                            className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs font-medium transition ${
                                                data.cetak_label_rangkap === '0'
                                                    ? 'bg-white border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                                                    : 'border-slate-200 text-slate-600 hover:bg-white'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="cetak_label_rangkap"
                                                value="0"
                                                checked={data.cetak_label_rangkap === '0'}
                                                onChange={(e) => setData('cetak_label_rangkap', e.target.value)}
                                                className="text-emerald-600 focus:ring-0"
                                            />
                                            <span>Sama Persis (Tanpa Label)</span>
                                        </label>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Lembar 1 bertuliskan <em>• LEMBAR PASIEN •</em> dan Lembar 2 bertuliskan <em>• LEMBAR RESEP / PETUGAS •</em>.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Live Receipt Preview (matching user's uploaded photo) */}
                        <div className="lg:col-span-5 bg-slate-100 p-4 rounded-2xl flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                PREVIEW HASIL CETAKAN STRUK {data.cetak_jumlah_lembar === '2' ? '(2 HALAMAN TERPISAH)' : ''}
                            </span>
                            <div className="space-y-3.5 flex flex-col items-center w-full">
                                {[...Array(Number(data.cetak_jumlah_lembar || 1))].map((_, idx) => (
                                    <div key={idx} className="flex flex-col items-center w-full">
                                        {Number(data.cetak_jumlah_lembar || 1) > 1 && (
                                            <span className="text-[10px] font-bold text-slate-600 bg-slate-200/90 border border-slate-300 px-2 py-0.5 rounded-full mb-1">
                                                Halaman {idx + 1}: {idx === 0 ? 'Untuk Pasien' : 'Untuk Resep / Petugas'}
                                            </span>
                                        )}
                                        <div
                                            className="bg-white text-black p-5 shadow-md border border-slate-300 text-center font-mono"
                                            style={{
                                                width: data.cetak_ukuran_kertas === '58mm' ? '54mm' : '74mm',
                                                fontFamily: "'Courier New', Courier, monospace",
                                            }}
                                        >
                                            <div className="font-black text-xs uppercase tracking-tight">
                                                NOMOR ANTRIAN FARMASI
                                            </div>
                                            <div className="font-bold text-[11px] uppercase mt-0.5">
                                                OBAT NON RACIKAN
                                            </div>
                                            <div className="text-[10px] text-slate-700 mt-0.5">
                                                {data.nama_rumah_sakit || 'RS PKU Muhammadiyah Sekapuk'}
                                            </div>

                                            <div className="border-t border-b border-black my-2 py-1">
                                                <div className="text-4xl font-black tracking-widest my-1">
                                                    {sampleNomor}
                                                </div>
                                            </div>

                                            <div className="text-[10px] text-slate-700">
                                                {new Date().toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </div>

                                            {Number(data.cetak_jumlah_lembar || 1) > 1 && data.cetak_label_rangkap === '1' && (
                                                <div className="text-[10px] font-bold mt-2 pt-1 border-t border-dashed border-slate-400 uppercase tracking-wider">
                                                    {idx === 0 ? '• LEMBAR PASIEN •' : '• LEMBAR RESEP / PETUGAS •'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-2.5 text-center">
                                * Dicetak dengan orientasi tegak (Portrait) pada printer thermal {data.cetak_ukuran_kertas}.
                                {Number(data.cetak_jumlah_lembar || 1) > 1 && ' Setiap halaman dicetak terpisah (Auto-Cut).'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Identitas & Logo Rumah Sakit */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-slate-800 text-base">
                                Identitas & Logo Rumah Sakit
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Logo dan nama ini akan ditampilkan secara dinamis di seluruh header sistem, sidebar, dan layar display publik.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Logo Upload & Preview */}
                        <div className="md:col-span-1 space-y-3">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Logo Rumah Sakit
                            </label>

                            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-50/80 transition relative">
                                {previewUrl ? (
                                    <div className="space-y-3 text-center">
                                        <img
                                            src={previewUrl}
                                            alt="Preview Logo"
                                            className="h-28 w-auto object-contain mx-auto rounded-lg shadow-2xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleHapusLogo}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Hapus Logo</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="h-14 w-14 rounded-full bg-emerald-100/60 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-600">
                                            Belum ada logo terpasang
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Format PNG, JPG, atau WEBP (Maks. 2MB)
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition gap-2 shadow-2xs">
                                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                                    <span>Pilih File Logo Baru</span>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                {errors.logo_file && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.logo_file}</p>
                                )}
                            </div>
                        </div>

                        {/* Fields Identitas */}
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Nama Rumah Sakit <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_rumah_sakit}
                                    onChange={(e) => setData('nama_rumah_sakit', e.target.value)}
                                    placeholder="Contoh: RS PKU MUHAMMADIYAH SEKAPUK"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-sm font-semibold"
                                    required
                                />
                                {errors.nama_rumah_sakit && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.nama_rumah_sakit}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Nama Unit / Bagian Layanan <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_unit}
                                    onChange={(e) => setData('nama_unit', e.target.value)}
                                    placeholder="Contoh: Instalasi Farmasi"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-sm font-semibold"
                                    required
                                />
                                {errors.nama_unit && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.nama_unit}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Alamat Instansi / Rumah Sakit
                                </label>
                                <textarea
                                    rows="2"
                                    value={data.alamat_rs}
                                    onChange={(e) => setData('alamat_rs', e.target.value)}
                                    placeholder="Alamat lengkap instansi..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 text-sm"
                                />
                                {errors.alamat_rs && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.alamat_rs}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Format Nomor Antrean & Teks Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Prefix & Digit Angka */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
                        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                            <Hash className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-slate-800 text-base">
                                Format Nomor & Reset Harian
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Jumlah Digit (Padding)
                                </label>
                                <select
                                    value={data.queue_padding}
                                    onChange={(e) => setData('queue_padding', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 text-sm bg-white font-mono"
                                >
                                    <option value="1">1 Digit (A1)</option>
                                    <option value="2">2 Digit (A01)</option>
                                    <option value="3">3 Digit (A001)</option>
                                    <option value="4">4 Digit (A0001)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Reset Nomor Otomatis Setiap Hari
                                </label>
                                <select
                                    value={data.daily_reset}
                                    onChange={(e) => setData('daily_reset', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 text-sm bg-white font-medium"
                                >
                                    <option value="1">Ya, reset kembali ke nomor 1 setiap berganti hari (Rekomendasi)</option>
                                    <option value="0">Tidak, lanjutkan nomor urut sebelumnya</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Running Text */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
                        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-slate-800 text-base">
                                Teks Berjalan (Running Text)
                            </h3>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Running Text (Teks Berjalan di Layar Display)
                            </label>
                            <textarea
                                rows="5"
                                value={data.running_text}
                                onChange={(e) => setData('running_text', e.target.value)}
                                placeholder="Teks informasi atau himbauan untuk pasien di ruang tunggu..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-sm"
                            />
                            {errors.running_text && (
                                <p className="text-xs text-rose-600 mt-1">{errors.running_text}</p>
                            )}
                            <span className="text-[11px] text-slate-400 block mt-1">
                                Pesan ini berjalan terus-menerus di bagian bawah layar display monitor ruang tunggu.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tombol Simpan */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-200 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{processing ? 'Menyimpan Perubahan...' : 'Simpan Semua Pengaturan'}</span>
                    </button>
                </div>
            </form>
        </HospitalLayout>
    );
}
