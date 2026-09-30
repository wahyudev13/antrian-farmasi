import React, { useState, useEffect, useRef } from 'react';
import HospitalLayout from '@/Layouts/HospitalLayout';
import { Head, router, usePage, Link } from '@inertiajs/react';
import {
    Megaphone,
    RotateCcw,
    CheckCircle2,
    SkipForward,
    Layers,
    Clock,
    Users,
    Printer,
    Ticket
} from 'lucide-react';
import { formatNomorSpeech } from '@/Utils/terbilang';

export default function PemanggilanIndex({
    auth,
    loketsData,
    totalWaiting,
    totalServed,
    totalSkipped,
}) {
    const { flash } = usePage().props;
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [autoPrint, setAutoPrint] = useState(true);
    const [issuingLoketId, setIssuingLoketId] = useState(null);
    const isBusyRef = useRef(false);
    const lastPrintedTicketIdRef = useRef(null);
    const isPrintingRef = useRef(false);

    const activeUtteranceRef = useRef(null);

    // Audio TTS Helper
    const speakCall = (audioData) => {
        if (!soundEnabled || !('speechSynthesis' in window) || !audioData) return;

        try {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
            window.speechSynthesis.cancel();

            const nomorSpeech = formatNomorSpeech(audioData.nomor);
            const text = `Nomor antrean, ${nomorSpeech}, silakan menuju ${audioData.loket}`;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = 0.88;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices() || [];
            let idVoice = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID');
            if (!idVoice) {
                idVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('id'));
            }
            if (!idVoice && voices.length > 0) {
                idVoice = voices.find(v => v.default) || voices[0];
            }
            if (idVoice) {
                utterance.voice = idVoice;
            }

            activeUtteranceRef.current = utterance;
            utterance.onend = () => {
                activeUtteranceRef.current = null;
            };
            utterance.onerror = (e) => {
                console.warn('SpeechSynthesis error:', e);
                activeUtteranceRef.current = null;
            };

            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 50);
        } catch (e) {
            console.error('Pemanggilan speakCall error:', e);
        }
    };

    // Auto-speak on flash called_audio
    useEffect(() => {
        if (flash?.called_audio) {
            speakCall(flash.called_audio);
        }
    }, [flash?.called_audio]);

    // Direct Browser Print without modal overlay - fresh frame with cache-busting
    const printTicket = (ticketId) => {
        if (!ticketId) return;

        // Prevent duplicate trigger for the same ticket within 3 seconds
        if (lastPrintedTicketIdRef.current === ticketId && isPrintingRef.current) {
            return;
        }
        lastPrintedTicketIdRef.current = ticketId;
        isPrintingRef.current = true;

        setTimeout(() => {
            isPrintingRef.current = false;
        }, 3000);

        // Clean up previous iframe if still in DOM to ensure clean print context
        const prevIframe = document.getElementById('print-ticket-iframe');
        if (prevIframe) {
            try {
                prevIframe.remove();
            } catch (e) {
                // ignore
            }
        }

        const iframe = document.createElement('iframe');
        iframe.id = 'print-ticket-iframe';
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '320px';
        iframe.style.height = '480px';
        iframe.style.border = 'none';
        iframe.style.opacity = '0.01';
        iframe.style.pointerEvents = 'none';
        iframe.style.zIndex = '-9999';

        let hasPrinted = false;
        iframe.onload = () => {
            // Guard: ensure onload only executes once and ignores initial about:blank
            try {
                const href = iframe.contentWindow?.location?.href;
                if (!href || href === 'about:blank') return;
            } catch (e) {
                // cross-origin
            }

            if (hasPrinted) return;
            hasPrinted = true;

            setTimeout(() => {
                try {
                    const iframeWin = iframe.contentWindow;
                    if (iframeWin) {
                        iframeWin.focus();
                        iframeWin.print();
                    }
                } catch (e) {
                    console.error('Print error in iframe, opening print window directly:', e);
                    window.open(route('antrean.cetak', ticketId), '_blank', 'width=350,height=550');
                } finally {
                    setTimeout(() => {
                        try {
                            iframe.remove();
                        } catch (err) {}
                    }, 1500);
                }
            }, 250);
        };

        iframe.src = route('antrean.cetak', ticketId) + '?embedded=1&t=' + Date.now();
        document.body.appendChild(iframe);
    };

    // 1-Click Ticket Issuance per loket - protected with debounce and disabled state to prevent duplicate tickets
    const handleQuickIssue = (loketId) => {
        if (isBusyRef.current || issuingLoketId !== null) return;
        isBusyRef.current = true;
        setIssuingLoketId(loketId);

        router.post(
            route('antrean.store'),
            {
                loket_id: loketId,
            },
            {
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
                only: ['loketsData', 'totalWaiting', 'totalServed', 'totalSkipped', 'flash'],
                onSuccess: (page) => {
                    const ticket = page.props.flash?.latest_antrean || flash?.latest_antrean;
                    if (ticket && autoPrint) {
                        printTicket(ticket.id);
                    }
                },
                onFinish: () => {
                    // Safe cooldown of 1000ms before enabling button again to prevent double-click
                    setTimeout(() => {
                        isBusyRef.current = false;
                        setIssuingLoketId(null);
                    }, 1000);
                },
            }
        );
    };

    // Calling handlers with smooth state & scroll preservation, instant without progress loading
    const handlePanggilBerikutnya = (loketId) => {
        if (isBusyRef.current) return;
        isBusyRef.current = true;

        router.post(
            route('pemanggilan.next'),
            {
                loket_id: loketId,
            },
            {
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
                only: ['loketsData', 'totalWaiting', 'totalServed', 'totalSkipped', 'flash'],
                onFinish: () => {
                    isBusyRef.current = false;
                },
            }
        );
    };

    const handlePanggilAntrean = (antreanId, loketId) => {
        if (isBusyRef.current) return;
        isBusyRef.current = true;

        router.post(
            route('pemanggilan.panggil', antreanId),
            { loket_id: loketId },
            {
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
                only: ['loketsData', 'totalWaiting', 'totalServed', 'totalSkipped', 'flash'],
                onFinish: () => {
                    isBusyRef.current = false;
                },
            }
        );
    };

    const handlePanggilUlang = (antreanId, loketId) => {
        if (isBusyRef.current) return;
        isBusyRef.current = true;

        router.post(
            route('pemanggilan.ulang', antreanId),
            { loket_id: loketId },
            {
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
                only: ['loketsData', 'totalWaiting', 'totalServed', 'totalSkipped', 'flash'],
                onFinish: () => {
                    isBusyRef.current = false;
                },
            }
        );
    };

    const handleMulaiLayani = (antreanId) => {
        router.patch(
            route('pemanggilan.layani', antreanId),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
                only: ['loketsData', 'totalWaiting', 'totalServed', 'totalSkipped', 'flash'],
            }
        );
    };

    const handleSelesai = (antreanId) => {
        router.patch(
            route('pemanggilan.selesai', antreanId),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
                only: ['loketsData', 'totalWaiting', 'totalServed', 'totalSkipped', 'flash'],
            }
        );
    };

    const handleLewati = (antreanId, nomor) => {
        if (confirm(`Yakin ingin melewati nomor antrean ${nomor}?`)) {
            router.patch(
                route('pemanggilan.lewati', antreanId),
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    showProgress: false,
                    only: ['loketsData', 'totalWaiting', 'totalServed', 'totalSkipped', 'flash'],
                }
            );
        }
    };

    return (
        <HospitalLayout
            user={auth.user}
            header="Meja Pelayanan Terpadu Farmasi"
            description="Buat karcis antrean baru dan panggil antrean pasien dalam 1 halaman kerja terpadu"
            fluid={true}
        >
            <Head title="Pelayanan & Pemanggilan Antrean" />

            <div className="space-y-3.5">
                {/* Top Quick Status & Actions Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-2.5 px-4 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Menunggu: <strong className="font-mono text-xs">{totalWaiting}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Selesai Hari Ini: <strong className="font-mono text-xs">{totalServed}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                            <SkipForward className="w-3.5 h-3.5 text-rose-600" />
                            <span>Terlewat: <strong className="font-mono text-xs">{totalSkipped || 0}</strong></span>
                        </div>

                        {/* Auto Print Toggle */}
                        <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer select-none transition">
                            <input
                                type="checkbox"
                                checked={autoPrint}
                                onChange={(e) => setAutoPrint(e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                            />
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                            <span>Cetak Karcis</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <Link
                            href={route('pemanggilan.pasien.index')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs"
                        >
                            <Users className="w-3.5 h-3.5 text-purple-600" />
                            <span>Mode Pasien SIMRS</span>
                        </Link>
                    </div>
                </div>

                {/* Multi-Counter Grid: dynamically fitting the screen without empty columns */}
                <div className={`grid grid-cols-1 ${
                    loketsData.length === 1
                        ? 'grid-cols-1'
                        : loketsData.length === 2
                        ? 'md:grid-cols-2'
                        : loketsData.length === 3
                        ? 'md:grid-cols-2 lg:grid-cols-3'
                        : 'sm:grid-cols-2 lg:grid-cols-4'
                } gap-3.5 items-stretch`}>
                    {loketsData.map((loket) => {
                        const current = loket.currentAntrean;
                        const isServing = current?.status === 'dilayani';
                        const loketColor = loket.warna || '#10b981';

                        return (
                            <div
                                key={loket.id}
                                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between overflow-hidden hover:border-blue-400/80 transition"
                            >
                                {/* Loket Header Bar */}
                                <div
                                    className="text-white p-3 border-b flex items-center justify-between gap-2"
                                    style={{ backgroundColor: loketColor }}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-8 w-8 shrink-0 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-black text-base font-mono shadow-inner border border-white/30">
                                            {loket.prefix}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-black text-xs sm:text-sm tracking-wide text-white uppercase drop-shadow-xs truncate">
                                                    {loket.nama}
                                                </h3>
                                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-black/25 text-white border border-white/20 shrink-0">
                                                    #{loket.nomor_display}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/25 text-white border border-white/30 backdrop-blur-xs">
                                            <Clock className="w-3 h-3" />
                                            <span>{loket.waitingCount} Menunggu</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Body Container */}
                                <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                                    {/* 1-CLICK TICKET ISSUANCE BAR */}
                                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className="w-7 h-7 shrink-0 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                                <Ticket className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 leading-none">
                                                    Karcis
                                                </div>
                                                <div className="text-xs font-black font-mono text-slate-800">
                                                    <span className="text-blue-600">{loket.nextNomor}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={issuingLoketId !== null}
                                            onClick={() => handleQuickIssue(loket.id)}
                                            className={`px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 shrink-0 ${
                                                issuingLoketId === loket.id
                                                    ? 'bg-blue-400 cursor-not-allowed opacity-80'
                                                    : issuingLoketId !== null
                                                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                                                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow cursor-pointer'
                                            }`}
                                            title={issuingLoketId === loket.id ? 'Sedang menerbitkan tiket...' : `Cetak karcis tiket antrean baru nomor ${loket.nextNomor}`}
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>
                                                {issuingLoketId === loket.id
                                                    ? 'Menerbitkan...'
                                                    : `+ Ambil Karcis (${loket.prefix})`}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Table of Queues with Direct Action Buttons */}
                                    <div className="border-t border-slate-100 pt-2 space-y-1.5 flex-1 flex flex-col min-h-0">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            <span>Daftar Antrean ({loket.prefix}):</span>
                                            <span className="font-mono text-emerald-700 font-black">{loket.waitingCount} Menunggu</span>
                                        </div>

                                        <div className="space-y-1.5 max-h-72 sm:max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                            {/* Currently Calling/Serving Queue Ticket */}
                                            {current && (
                                                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/60 text-white shadow-sm flex flex-col gap-1.5 animate-in fade-in duration-150">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="inline-flex items-center gap-1 font-mono font-black text-emerald-400 text-sm tracking-wide">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                                                {current.nomor}
                                                            </span>
                                                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700">
                                                                {isServing ? 'Dilayani' : 'Dipanggil'}
                                                            </span>
                                                        </div>
                                                        <span className="font-mono text-[10px] text-slate-400">
                                                            #{current.jumlah_panggilan}
                                                        </span>
                                                    </div>

                                                    {current.nama_pasien && (
                                                        <div className="text-xs font-bold text-white uppercase truncate">
                                                            {current.nama_pasien}
                                                        </div>
                                                    )}

                                                    {/* Direct Control Buttons in the Table */}
                                                    <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePanggilUlang(current.id, loket.id)}
                                                            className="px-1.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
                                                            title="Membunyikan audio panggilan ulang"
                                                        >
                                                            <RotateCcw className="w-3 h-3 text-amber-400" />
                                                            <span>Ulang</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelesai(current.id)}
                                                            className="px-1.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                                                            title="Selesai Pelayanan"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span>Selesai</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLewati(current.id, current.nomor)}
                                                            className="px-1.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs border border-rose-800/50 transition flex items-center justify-center gap-1 cursor-pointer"
                                                            title="Lewati Antrean"
                                                        >
                                                            <SkipForward className="w-3 h-3" />
                                                            <span>Lewati</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Waiting Queue Tickets with Direct Call Buttons */}
                                            {loket.waitingAntreans.map((antrean, idx) => (
                                                <div
                                                    key={antrean.id}
                                                    className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition shadow-2xs ${
                                                        !current && idx === 0
                                                            ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-300'
                                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-mono font-black text-emerald-900 bg-emerald-100 px-2 py-1 rounded-lg text-xs shrink-0 border border-emerald-300/80">
                                                            {antrean.nomor}
                                                        </span>
                                                        {antrean.nama_pasien && (
                                                            <span className="font-bold text-slate-800 uppercase truncate max-w-[120px] sm:max-w-[150px] text-xs" title={antrean.nama_pasien}>
                                                                {antrean.nama_pasien}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => printTicket(antrean.id)}
                                                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200 font-bold text-xs flex items-center gap-1 shadow-2xs hover:shadow transition cursor-pointer"
                                                            title={`Cetak ulang karcis antrean ${antrean.nomor}`}
                                                        >
                                                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                                                            <span>Cetak Ulang</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handlePanggilAntrean(antrean.id, loket.id)}
                                                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                                                            title={`Panggil nomor antrean ${antrean.nomor}`}
                                                        >
                                                            <Megaphone className="w-3.5 h-3.5" />
                                                            <span>Panggil</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {!current && loket.waitingAntreans.length === 0 && (
                                                <div className="text-center py-4 text-[11px] text-slate-400 italic bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                                                    Tidak ada antrean menunggu
                                                </div>
                                            )}

                                            {/* Sub-daftar Nomor Terlewat dengan Tombol Panggil Lagi */}
                                            {loket.skippedAntreans && loket.skippedAntreans.length > 0 && (
                                                <div className="pt-2 mt-2 border-t border-dashed border-amber-300/80 space-y-1.5">
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 uppercase tracking-wider px-0.5">
                                                        <span className="flex items-center gap-1.5">
                                                             <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                             Nomor Terlewat ({loket.prefix}):
                                                         </span>
                                                        <span className="font-mono bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-full text-[9px] font-black">
                                                            {loket.skippedCount} Terlewat
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        {loket.skippedAntreans.map((antrean) => (
                                                            <div
                                                                key={antrean.id}
                                                                className="px-3 py-2 rounded-xl border border-amber-200/90 bg-amber-50/60 flex items-center justify-between gap-2 text-xs transition shadow-2xs hover:bg-amber-50"
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-1 rounded-lg text-xs shrink-0 border border-amber-300">
                                                                        {antrean.nomor}
                                                                    </span>
                                                                    {antrean.nama_pasien && (
                                                                        <span className="font-bold text-slate-800 uppercase truncate max-w-[100px] sm:max-w-[130px] text-xs" title={antrean.nama_pasien}>
                                                                            {antrean.nama_pasien}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] font-semibold text-amber-700 italic shrink-0">
                                                                        (Terlewat)
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => printTicket(antrean.id)}
                                                                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1 shadow-2xs hover:shadow transition cursor-pointer"
                                                                        title={`Cetak ulang karcis antrean ${antrean.nomor}`}
                                                                    >
                                                                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                                                                        <span>Cetak</span>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handlePanggilAntrean(antrean.id, loket.id)}
                                                                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                                                                        title={`Panggil lagi nomor antrean terlewat ${antrean.nomor}`}
                                                                    >
                                                                        <Megaphone className="w-3.5 h-3.5" />
                                                                        <span>Panggil Lagi</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {loketsData.length === 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                        <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <h3 className="font-bold text-slate-800 text-base">Belum Ada Loket Pelayanan Aktif</h3>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                            Silakan aktifkan loket pelayanan pada menu Master Loket terlebih dahulu.
                        </p>
                        <Link
                            href={route('loket.index')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
                        >
                            <span>Ke Master Loket</span>
                        </Link>
                    </div>
                )}
            </div>
        </HospitalLayout>
    );
}
