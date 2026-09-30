import React, { useState, useEffect } from 'react';
import HospitalLayout from '@/Layouts/HospitalLayout';
import { Head, router, usePage, Link } from '@inertiajs/react';
import {
    Ticket,
    Printer,
    CheckCircle2,
    ArrowLeft,
    Clock,
    ChevronDown,
    ChevronUp,
    FileText,
    User,
    Sparkles,
    Check,
    X,
    Tv,
    Megaphone,
    ExternalLink
} from 'lucide-react';

export default function AntreanCreate({ auth, lokets, defaultLoketId, nextNomor }) {
    const { flash, pengaturan } = usePage().props;
    const [submittingLoketId, setSubmittingLoketId] = useState(null);
    const [createdTicket, setCreatedTicket] = useState(null);
    const [autoPrint, setAutoPrint] = useState(true);
    const [showOptionalFields, setShowOptionalFields] = useState(false);

    // Optional fields state
    const [optionalData, setOptionalData] = useState({
        nama_pasien: '',
        no_rawat: '',
        no_rkm_medis: '',
    });

    // Detect new ticket from flash and trigger print
    useEffect(() => {
        if (flash?.latest_antrean) {
            setCreatedTicket(flash.latest_antrean);
            setSubmittingLoketId(null);
            // Reset optional form
            setOptionalData({
                nama_pasien: '',
                no_rawat: '',
                no_rkm_medis: '',
            });
            setShowOptionalFields(false);

            // Auto-trigger browser print dialog if enabled
            if (autoPrint) {
                const timer = setTimeout(() => {
                    window.print();
                }, 350);
                return () => clearTimeout(timer);
            }
        }
    }, [flash]);

    // 1-Click Ticket Issuance
    const handleQuickIssue = (loketId) => {
        setSubmittingLoketId(loketId);
        router.post(
            route('antrean.store'),
            {
                loket_id: loketId,
                nama_pasien: optionalData.nama_pasien || null,
                no_rawat: optionalData.no_rawat || null,
                no_rkm_medis: optionalData.no_rkm_medis || null,
            },
            {
                preserveScroll: true,
                onFinish: () => setSubmittingLoketId(null),
            }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const handleOpenPrintWindow = (ticketId) => {
        if (!ticketId) return;
        window.open(
            route('antrean.cetak', ticketId),
            '_blank',
            'width=450,height=650,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
        );
    };

    return (
        <HospitalLayout
            user={auth.user}
            header="Ambil Karcis Antrean Farmasi"
            description="Tekan tombol loket untuk langsung mencetak tiket karcis antrean untuk diserahkan ke pasien"
        >
            <Head title="Ambil Antrean Farmasi" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Navigation & Links */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={route('antrean.index')}
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Daftar Antrean</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('pemanggilan.index')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                            <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Meja Pemanggilan</span>
                        </Link>
                        <a
                            href="/display"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                        >
                            <Tv className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Display Monitor</span>
                        </a>
                    </div>
                </div>

                {/* Banner Instruction with Auto-Print Switch */}
                <div className="bg-emerald-600 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-200 bg-emerald-700/60 px-2.5 py-0.5 rounded-md">
                                TIKET PASIEN FARMASI
                            </span>
                            <span className="text-xs text-emerald-100 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                Siap Cetak
                            </span>
                        </div>
                        <h2 className="text-2xl font-black mt-1">
                            Tekan Tombol di Bawah untuk Cetak Karcis
                        </h2>
                        <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                            Saat tombol loket diklik, nomor antrean langsung terbit dan dialog cetak karcis akan otomatis muncul untuk diserahkan ke pasien.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-emerald-700/70 p-2.5 rounded-2xl border border-emerald-500/40">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs font-bold text-white select-none">
                            <input
                                type="checkbox"
                                checked={autoPrint}
                                onChange={(e) => setAutoPrint(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 bg-emerald-800 border-emerald-400 focus:ring-0 cursor-pointer"
                            />
                            <span>Cetak Otomatis ke Printer</span>
                        </label>
                    </div>
                </div>

                {/* 1-CLICK TICKET DISPENSER GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {lokets.map((loket) => {
                        const isProcessing = submittingLoketId === loket.id;
                        const isRacikan = loket.nama?.toLowerCase().includes('racikan') && !loket.nama?.toLowerCase().includes('non');

                        return (
                            <div
                                key={loket.id}
                                className={`rounded-3xl border-2 p-6 flex flex-col justify-between transition shadow-md ${
                                    isRacikan
                                        ? 'bg-gradient-to-br from-white via-indigo-50/30 to-indigo-100/40 border-indigo-200 hover:border-indigo-400'
                                        : 'bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/40 border-emerald-200 hover:border-emerald-400'
                                }`}
                            >
                                <div>
                                    {/* Top badges */}
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`font-mono font-black text-xs px-3 py-1 rounded-xl uppercase tracking-wider border shadow-2xs ${
                                                isRacikan
                                                    ? 'bg-indigo-600 text-white border-indigo-700'
                                                    : 'bg-emerald-600 text-white border-emerald-700'
                                            }`}
                                        >
                                            PREFIX {loket.prefix}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-slate-500">
                                            Display #{loket.nomor_display}
                                        </span>
                                    </div>

                                    {/* Loket Name & Description */}
                                    <div className="mt-4">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                            {loket.nama}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {isRacikan
                                                ? 'Resep obat puyer, kapsul, salep racik / butuh peracikan'
                                                : 'Resep obat jadi, tablet kemasan, sirup paten langsung siap'}
                                        </p>
                                    </div>

                                    {/* Big Next Queue Number Box */}
                                    <div className="mt-5 p-4 rounded-2xl bg-slate-900 text-white text-center border border-slate-800 shadow-inner">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">
                                            NOMOR BERIKUTNYA
                                        </span>
                                        <div
                                            className={`text-5xl font-black font-mono tracking-wider mt-1 ${
                                                isRacikan ? 'text-indigo-400' : 'text-emerald-400'
                                            }`}
                                        >
                                            {loket.nextNomor}
                                        </div>
                                        <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{loket.waitingToday} antrean sedang menunggu</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main 1-Click Button */}
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        disabled={isProcessing}
                                        onClick={() => handleQuickIssue(loket.id)}
                                        className={`w-full py-4 px-6 rounded-2xl font-black text-base text-white shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 ${
                                            isRacikan
                                                ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-600/30'
                                                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/30'
                                        } disabled:opacity-50`}
                                    >
                                        <Printer className="w-5 h-5" />
                                        <span>
                                            {isProcessing
                                                ? 'Mencetak Karcis...'
                                                : `AMBIL & CETAK ${loket.prefix} (${loket.nextNomor})`}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Optional Collapsible Form for Patient Details */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowOptionalFields(!showOptionalFields)}
                        className="w-full px-5 py-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                    >
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span>
                                {showOptionalFields
                                    ? 'Sembunyikan Form Tambahan (Identitas Pasien)'
                                    : '+ Catat Nama Pasien / No. RM (Opsional - Jika Diperlukan)'}
                            </span>
                        </span>
                        {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showOptionalFields && (
                        <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                            <p className="text-xs text-slate-500">
                                Bagian ini bersifat <strong>opsional</strong>. Tiket karcis tetap sah dan dapat dicetak hanya dengan nomor antrean.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nama Pasien (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={optionalData.nama_pasien}
                                        onChange={(e) =>
                                            setOptionalData({ ...optionalData, nama_pasien: e.target.value })
                                        }
                                        placeholder="Ketik nama jika ada..."
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        No. RM (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={optionalData.no_rkm_medis}
                                        onChange={(e) =>
                                            setOptionalData({ ...optionalData, no_rkm_medis: e.target.value })
                                        }
                                        placeholder="Contoh: 012345"
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        No. Rawat (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={optionalData.no_rawat}
                                        onChange={(e) =>
                                            setOptionalData({ ...optionalData, no_rawat: e.target.value })
                                        }
                                        placeholder="Contoh: 2026/09/23/0001"
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL CETAK KARCIS UNTUK DISERAHKAN KE PASIEN */}
            {createdTicket && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
                        {/* Modal Header */}
                        <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Printer className="w-5 h-5 text-emerald-200" />
                                <div>
                                    <span className="font-bold text-sm block">Karcis Siap Dicetak</span>
                                    <span className="text-[10px] text-emerald-100">Serahkan karcis ini ke pasien</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCreatedTicket(null)}
                                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Printable Thermal Receipt Card (Preview & Thermal Print Target) */}
                        {(() => {
                            const jumlahLembar = Math.max(1, parseInt(pengaturan?.cetak_jumlah_lembar || '1', 10));
                            const labelRangkap = (pengaturan?.cetak_label_rangkap ?? '1') === '1';

                            return (
                                <div id="printable-tickets-wrapper" className="max-h-[60vh] overflow-y-auto divide-y divide-dashed divide-slate-300">
                                    {[...Array(jumlahLembar)].map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`printable-ticket-card p-6 text-center space-y-2 bg-white text-black font-sans ${
                                                idx < jumlahLembar - 1 ? 'print-page-break' : ''
                                            }`}
                                        >
                                            {jumlahLembar > 1 && (
                                                <div className="text-[10px] font-bold text-slate-500 uppercase no-print mb-1">
                                                    Halaman {idx + 1}: {idx === 0 ? 'Untuk Pasien' : 'Untuk Resep / Petugas'}
                                                </div>
                                            )}
                                            <div className="font-black text-xs sm:text-sm uppercase tracking-tight">
                                                NOMOR ANTRIAN FARMASI
                                            </div>
                                            <div className="font-black text-xs uppercase text-slate-900">
                                                {createdTicket.loket?.nama || 'OBAT NON RACIKAN'}
                                            </div>
                                            <div className="text-[11px] text-slate-700">
                                                {pengaturan?.nama_rumah_sakit || 'RS PKU Muhammadiyah Sekapuk'}
                                            </div>

                                            <div className="border-t-2 border-b-2 border-black my-2.5 py-1">
                                                <div className="text-5xl sm:text-6xl font-black tracking-widest my-1 font-sans">
                                                    {createdTicket.prefix ? `${createdTicket.prefix}-${createdTicket.nomor_urut || createdTicket.nomor?.replace(/\D/g, '') || '1'}` : createdTicket.nomor}
                                                </div>
                                            </div>

                                            {createdTicket.nama_pasien && (
                                                <div className="text-xs font-bold uppercase">
                                                    PASIEN: {createdTicket.nama_pasien}
                                                </div>
                                            )}

                                            <div className="text-xs text-slate-700 font-medium">
                                                {new Date(createdTicket.waktu_daftar || Date.now()).toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </div>

                                            {jumlahLembar > 1 && labelRangkap && (
                                                <div className="text-xs font-bold pt-2 border-t border-dashed border-black uppercase tracking-wider mt-2">
                                                    {idx === 0 ? '• LEMBAR PASIEN •' : '• LEMBAR RESEP / PETUGAS •'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Modal Action Buttons */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 active:bg-emerald-800 transition flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Cetak Karcis Sekarang (Print)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleOpenPrintWindow(createdTicket.id)}
                                className="w-full py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                <span>Buka Halaman Cetak Khusus</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCreatedTicket(null)}
                                className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-800 font-semibold text-xs transition cursor-pointer"
                            >
                                Selesai / Ambil Antrean Berikutnya
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print specific CSS for thermal printer (58mm/80mm) */}
            <style>{`
                @page {
                    size: portrait;
                    margin: 0;
                }
                @media print {
                    @page {
                        size: portrait;
                        margin: 0;
                    }
                    html, body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        display: block !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #printable-tickets-wrapper, #printable-tickets-wrapper * {
                        visibility: visible !important;
                    }
                    #printable-tickets-wrapper {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                    }
                    .printable-ticket-card {
                        width: 76mm !important;
                        margin: 0 auto !important;
                        padding: 4mm 2mm !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: #fff !important;
                        color: #000 !important;
                        display: block !important;
                    }
                    .print-page-break {
                        page-break-after: always !important;
                        break-after: page !important;
                    }
                }
            `}</style>
        </HospitalLayout>
    );
}
