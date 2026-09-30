import React, { useState, useEffect, useMemo } from 'react';
import HospitalLayout from '@/Layouts/HospitalLayout';
import { Head, router, usePage, Link } from '@inertiajs/react';
import {
    Megaphone,
    RotateCcw,
    CheckCircle2,
    ArrowLeft,
    Clock,
    Search,
    RefreshCw,
    Stethoscope,
    ChevronDown,
    Building2,
    AlertCircle,
    Filter,
    X
} from 'lucide-react';
import { cleanPatientNameForSpeech } from '@/Utils/terbilang';

export default function PemanggilanPasien({
    auth,
    lokets,
    selectedLoket,
    recentCalls = [],
    simrsPatients = [],
    polikliniks = [],
    dokters = [],
    filters = {},
}) {
    const { flash } = usePage().props;
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedDate, setSelectedDate] = useState(
        filters.tanggal || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
    );
    const [selectedPoli, setSelectedPoli] = useState(filters.kd_poli || '');
    const [selectedDokter, setSelectedDokter] = useState(filters.kd_dokter || '');
    const [isCallingNoRawat, setIsCallingNoRawat] = useState(null);
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualName, setManualName] = useState('');

    const [soundEnabled, setSoundEnabled] = useState(false);
    const activeUtteranceRef = React.useRef(null);

    // Audio TTS Helper (off by default so it doesn't clash with Display screen)
    const speakCall = (audioData) => {
        if (!soundEnabled || !('speechSynthesis' in window) || !audioData) return;

        try {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
            window.speechSynthesis.cancel();

            const cleanName = cleanPatientNameForSpeech(audioData.nama);
            const text = `Pasien atas nama ${cleanName}, silakan menuju ${audioData.loket}`;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = 0.88;

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
            console.error('PemanggilanPasien speakCall error:', e);
        }
    };

    // Auto-speak on flash called_audio
    useEffect(() => {
        if (flash?.called_audio) {
            speakCall(flash.called_audio);
        }
    }, [flash]);

    // Available poliklinik options (from database + distinct patients)
    const allPolikliniks = useMemo(() => {
        const map = new Map();
        (polikliniks || []).forEach(p => {
            if (p.kd_poli && p.nm_poli) map.set(p.kd_poli, p.nm_poli);
        });
        (simrsPatients || []).forEach(p => {
            if (p.kd_poli && p.nm_poli && !map.has(p.kd_poli)) {
                map.set(p.kd_poli, p.nm_poli);
            }
        });
        return Array.from(map.entries()).map(([kd_poli, nm_poli]) => ({ kd_poli, nm_poli }));
    }, [polikliniks, simrsPatients]);

    // Available dokter options (from database + distinct patients)
    const allDokters = useMemo(() => {
        const map = new Map();
        (dokters || []).forEach(d => {
            if (d.kd_dokter && d.nm_dokter && d.nm_dokter !== '-') {
                map.set(d.kd_dokter, d.nm_dokter);
            }
        });
        (simrsPatients || []).forEach(p => {
            if (p.kd_dokter && p.nm_dokter && p.nm_dokter !== '-' && !map.has(p.kd_dokter)) {
                map.set(p.kd_dokter, p.nm_dokter);
            }
        });
        return Array.from(map.entries()).map(([kd_dokter, nm_dokter]) => ({ kd_dokter, nm_dokter }));
    }, [dokters, simrsPatients]);

    // Map of called patients today for quick status badge (preserves latest call count)
    const calledMap = useMemo(() => {
        const map = {};
        recentCalls.forEach((call) => {
            if (call.no_rawat && !map[call.no_rawat]) {
                map[call.no_rawat] = call;
            }
            if (call.no_rkm_medis && !map[call.no_rkm_medis]) {
                map[call.no_rkm_medis] = call;
            }
            if (call.nama_pasien) {
                const nameKey = call.nama_pasien.trim().toUpperCase();
                if (!map[nameKey]) {
                    map[nameKey] = call;
                }
            }
        });
        return map;
    }, [recentCalls]);

    // Filter patients locally by search, poli, and dokter in real-time
    const filteredPatients = useMemo(() => {
        return simrsPatients.filter((p) => {
            // Poli filter
            if (selectedPoli && p.kd_poli !== selectedPoli) {
                return false;
            }
            // Dokter filter
            if (selectedDokter && p.kd_dokter !== selectedDokter) {
                return false;
            }
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const name = (p.nm_pasien || '').toLowerCase();
                const rm = (p.no_rkm_medis || '').toLowerCase();
                const rawat = (p.no_rawat || '').toLowerCase();
                const poli = (p.nm_poli || '').toLowerCase();
                const dokter = (p.nm_dokter || '').toLowerCase();
                return name.includes(q) || rm.includes(q) || rawat.includes(q) || poli.includes(q) || dokter.includes(q);
            }
            return true;
        });
    }, [simrsPatients, searchQuery, selectedPoli, selectedDokter]);

    // Handle filter date or search submit to server
    const handleReload = (newDate = selectedDate, newSearch = searchQuery, newPoli = selectedPoli, newDokter = selectedDokter) => {
        router.get(
            route('pemanggilan.pasien.index'),
            {
                tanggal: newDate,
                search: newSearch,
                kd_poli: newPoli || undefined,
                kd_dokter: newDokter || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const hasActiveFilters = Boolean(selectedPoli || selectedDokter || searchQuery);

    const resetFilters = () => {
        setSelectedPoli('');
        setSelectedDokter('');
        setSearchQuery('');
        handleReload(selectedDate, '', '', '');
    };

    // Direct 1-Click Call Patient from SIMRS
    const handlePanggilSimrs = (patient) => {
        setIsCallingNoRawat(patient.no_rawat);
        router.post(
            route('pemanggilan.pasien.store'),
            {
                nama_pasien: patient.nm_pasien,
                no_rawat: patient.no_rawat,
                no_rkm_medis: patient.no_rkm_medis,
                jenis_kelamin: patient.jk,
                loket_id: selectedLoket?.id || lokets[0]?.id || null,
            },
            {
                preserveScroll: true,
                onFinish: () => setIsCallingNoRawat(null),
            }
        );
    };

    // Manual call fallback if needed
    const handleManualCall = (e) => {
        e.preventDefault();
        if (!manualName.trim()) return;

        router.post(
            route('pemanggilan.pasien.store'),
            {
                nama_pasien: manualName.trim().toUpperCase(),
                loket_id: selectedLoket?.id || lokets[0]?.id || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setManualName(''),
            }
        );
    };

    const handlePanggilUlang = (id, loketId, noRawat = null) => {
        if (noRawat) setIsCallingNoRawat(noRawat);
        router.post(route('pemanggilan.pasien.ulang', id), {
            loket_id: loketId || selectedLoket?.id || lokets[0]?.id,
        }, {
            preserveScroll: true,
            onFinish: () => setIsCallingNoRawat(null),
        });
    };

    const handleSelesai = (id) => {
        router.patch(route('pemanggilan.pasien.selesai', id), {}, {
            preserveScroll: true,
        });
    };

    return (
        <HospitalLayout
            user={auth.user}
            header="Panggil Pasien Farmasi Langsung"
            description="Panggil pasien langsung dari data registrasi SIMRS tanpa perlu input nama manual"
        >
            <Head title="Panggil Pasien Langsung" />

            <div className="space-y-5">
                {/* Top Navigation Bar (Button Audio Removed) */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route('pemanggilan.index')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Mode Panggil Nomor Tiket Antrean</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column (8 cols): SIMRS Patient List */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        {/* Header Bar without (reg_periksa) text */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-emerald-600" />
                                    <h3 className="font-bold text-slate-900 text-base">
                                        Data Pasien Registrasi
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pilih pasien langsung dari daftar registrasi untuk memanggil pasien ke display TV.
                                </p>
                            </div>

                            {/* Date Filter & Refresh */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            handleReload(e.target.value, searchQuery, selectedPoli, selectedDokter);
                                        }}
                                        className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-emerald-200"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleReload(selectedDate, searchQuery, selectedPoli, selectedDokter)}
                                    className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
                                    title="Segarkan Data Pasien"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Search & Filter Bar: Search, Poli, Dokter */}
                        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleReload(selectedDate, searchQuery, selectedPoli, selectedDokter);
                                        }
                                    }}
                                    placeholder="Cari nama pasien, No. RM, No. Rawat, Poli, atau Dokter..."
                                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Filters: Poliklinik & Dokter */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {/* Filter Poli */}
                                <div className="relative">
                                    <select
                                        value={selectedPoli}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedPoli(val);
                                            handleReload(selectedDate, searchQuery, val, selectedDokter);
                                        }}
                                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-700 truncate"
                                    >
                                        <option value="">Semua Poliklinik / Unit</option>
                                        {allPolikliniks.map((p) => (
                                            <option key={p.kd_poli} value={p.kd_poli}>
                                                {p.nm_poli}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filter Dokter */}
                                <div className="relative">
                                    <select
                                        value={selectedDokter}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedDokter(val);
                                            handleReload(selectedDate, searchQuery, selectedPoli, val);
                                        }}
                                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-700 truncate"
                                    >
                                        <option value="">Semua Dokter</option>
                                        {allDokters.map((d) => (
                                            <option key={d.kd_dokter} value={d.kd_dokter}>
                                                {d.nm_dokter}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active Filter Clear indicator */}
                            {hasActiveFilters && (
                                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                    <span>
                                        Menampilkan <strong>{filteredPatients.length}</strong> pasien terfilter
                                    </span>
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Reset Filter</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Patient List */}
                        <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
                            {filteredPatients.length === 0 ? (
                                <div className="py-16 text-center text-slate-400 px-4">
                                    <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                    <p className="font-semibold text-slate-600">Tidak ada data pasien ditemukan</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                        {hasActiveFilters
                                            ? 'Coba ubah atau reset filter poliklinik, dokter, atau kata kunci pencarian.'
                                            : 'Pastikan tanggal registrasi sesuai atau coba pilih tanggal registrasi lain.'}
                                    </p>
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                                        >
                                            Reset Semua Filter
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredPatients.map((patient) => {
                                    const called = calledMap[patient.no_rawat] || calledMap[patient.no_rkm_medis] || calledMap[patient.nm_pasien?.trim().toUpperCase()];
                                    const isCallingThis = isCallingNoRawat === patient.no_rawat;

                                    return (
                                        <div
                                            key={patient.no_rawat}
                                            className={`p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                called && called.status !== 'selesai'
                                                    ? 'bg-amber-50/40 hover:bg-amber-50/70 border-amber-200'
                                                    : called
                                                    ? 'bg-slate-50/50 hover:bg-slate-50/80'
                                                    : 'hover:bg-slate-50/80'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-black text-slate-900 text-base uppercase tracking-tight">
                                                        {patient.nm_pasien}
                                                    </span>
                                                    {patient.jk && (
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                                                                patient.jk === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                                                            }`}
                                                        >
                                                            {patient.jk === 'L' ? 'Laki-Laki' : 'Perempuan'}
                                                        </span>
                                                    )}
                                                    {called ? (
                                                        called.status === 'selesai' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span>Selesai ({called.jumlah_panggilan}x)</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 animate-pulse">
                                                                <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                                                                <span>Sedang Dipanggil ({called.jumlah_panggilan}x)</span>
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                            Belum Dipanggil
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2.5 text-xs text-slate-500 font-mono mt-1.5 flex-wrap">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                                                        RM: {patient.no_rkm_medis}
                                                    </span>
                                                    <span>No. Rawat: {patient.no_rawat}</span>
                                                    <span>•</span>
                                                    <span>Jam Reg: {patient.jam_reg || '-'}</span>
                                                </div>

                                                {(patient.nm_poli || patient.nm_dokter) && (
                                                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                                                        {patient.nm_poli && (
                                                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                                <Building2 className="w-3 h-3 text-emerald-600" />
                                                                {patient.nm_poli}
                                                            </span>
                                                        )}
                                                        {patient.nm_dokter && (
                                                            <span className="inline-flex items-center gap-1 text-slate-500">
                                                                <Stethoscope className="w-3 h-3 text-slate-400" />
                                                                {patient.nm_dokter}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Button: 1-Click Call or Complete */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {called && called.status !== 'selesai' ? (
                                                    // Pasien sedang dipanggil (belum selesai) -> Tampilkan tombol Selesai
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelesai(called.id)}
                                                            className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-xs transition active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                                            title="Tandai pelayanan penyerahan obat selesai"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>Selesai</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isCallingThis}
                                                            onClick={() => handlePanggilUlang(called.id, selectedLoket?.id, patient.no_rawat)}
                                                            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                                                            title="Panggil ulang jika pasien belum mendekat ke loket"
                                                        >
                                                            <RotateCcw className={`w-4 h-4 text-amber-500 ${isCallingThis ? 'animate-spin' : ''}`} />
                                                        </button>
                                                    </>
                                                ) : called && called.status === 'selesai' ? (
                                                    // Pasien sudah berstatus selesai -> Panggil Ulang jika diperlukan
                                                    <button
                                                        type="button"
                                                        disabled={isCallingThis}
                                                        onClick={() => handlePanggilUlang(called.id, selectedLoket?.id, patient.no_rawat)}
                                                        className="px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-xs transition active:scale-95 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer disabled:opacity-50"
                                                        title="Panggil kembali pasien ini"
                                                    >
                                                        <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isCallingThis ? 'animate-spin' : ''}`} />
                                                        <span>{isCallingThis ? 'Memanggil...' : 'Panggil Lagi'}</span>
                                                    </button>
                                                ) : (
                                                    // Pasien belum dipanggil
                                                    <button
                                                        type="button"
                                                        disabled={isCallingThis}
                                                        onClick={() => handlePanggilSimrs(patient)}
                                                        className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                                    >
                                                        <Megaphone className="w-4 h-4" />
                                                        <span>
                                                            {isCallingThis ? 'Memanggil...' : 'PANGGIL PASIEN'}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Fallback Collapsible Manual Input if urgent */}
                        <div className="p-3 bg-slate-50/70 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowManualForm(!showManualForm)}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition"
                            >
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showManualForm ? 'rotate-180' : ''}`} />
                                <span>Panggilan Darurat / Pasien Khusus Tanpa No. Rawat</span>
                            </button>

                            {showManualForm && (
                                <form onSubmit={handleManualCall} className="mt-2.5 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                        placeholder="Ketik nama pasien langsung..."
                                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 uppercase font-semibold"
                                    />
                                    <button
                                        type="submit"
                                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
                                    >
                                        Panggil Nama Ini
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Column (4 cols): Riwayat Panggilan Pasien Hari Ini */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-base text-slate-900">
                                    Riwayat Panggilan
                                </h3>
                            </div>
                            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                {recentCalls.length} Pasien
                            </span>
                        </div>

                        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                            {recentCalls.map((call) => (
                                <div
                                    key={call.id}
                                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition space-y-2"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="font-black text-slate-900 text-sm uppercase leading-snug">
                                            {call.nama_pasien}
                                        </div>
                                        {call.status === 'selesai' ? (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold shrink-0">
                                                Selesai
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                                                Dipanggil
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                                        <span>
                                            Jam: {new Date(call.waktu_panggil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span>Dipanggil {call.jumlah_panggilan}x</span>
                                    </div>

                                    {call.no_rkm_medis && (
                                        <div className="text-[11px] text-slate-500 font-mono">
                                            RM: {call.no_rkm_medis}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => handlePanggilUlang(call.id, call.loket_id)}
                                            className="flex-1 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Panggil Ulang</span>
                                        </button>

                                        {call.status !== 'selesai' && (
                                            <button
                                                type="button"
                                                onClick={() => handleSelesai(call.id)}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1"
                                                title="Tandai Selesai Penyerahan Obat"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Selesai</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {recentCalls.length === 0 && (
                                <div className="py-12 text-center text-slate-400 text-sm">
                                    Belum ada pasien yang dipanggil hari ini.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}
