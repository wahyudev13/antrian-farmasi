import React, { useState } from 'react';
import HospitalLayout from '@/Layouts/HospitalLayout';
import { Head, router, Link } from '@inertiajs/react';
import {
    FileText,
    Printer,
    Download,
    Calendar,
    Filter,
    Search,
    RotateCcw,
    Clock,
    CheckCircle2,
    SkipForward,
    Users,
    Ticket,
    Activity,
    ChevronRight,
    ArrowUpRight,
    Layers
} from 'lucide-react';

export default function LaporanIndex({
    auth,
    filters,
    lokets,
    stats,
    loketStats,
    reportData,
}) {
    const [jenis, setJenis] = useState(filters.jenis || 'antrean');
    const [tanggalMulai, setTanggalMulai] = useState(filters.tanggal_mulai || '');
    const [tanggalSelesai, setTanggalSelesai] = useState(filters.tanggal_selesai || '');
    const [loketId, setLoketId] = useState(filters.loket_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const [search, setSearch] = useState(filters.search || '');

    // Quick Date Presets
    const setPresetDate = (type) => {
        const today = new Date();
        const formatDate = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        if (type === 'hari_ini') {
            const nowStr = formatDate(today);
            setTanggalMulai(nowStr);
            setTanggalSelesai(nowStr);
            applyFilter({ tanggal_mulai: nowStr, tanggal_selesai: nowStr });
        } else if (type === 'kemarin') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const yestStr = formatDate(yesterday);
            setTanggalMulai(yestStr);
            setTanggalSelesai(yestStr);
            applyFilter({ tanggal_mulai: yestStr, tanggal_selesai: yestStr });
        } else if (type === '7_hari') {
            const last7 = new Date(today);
            last7.setDate(today.getDate() - 6);
            const startStr = formatDate(last7);
            const endStr = formatDate(today);
            setTanggalMulai(startStr);
            setTanggalSelesai(endStr);
            applyFilter({ tanggal_mulai: startStr, tanggal_selesai: endStr });
        } else if (type === 'bulan_ini') {
            const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startStr = formatDate(startMonth);
            const endStr = formatDate(today);
            setTanggalMulai(startStr);
            setTanggalSelesai(endStr);
            applyFilter({ tanggal_mulai: startStr, tanggal_selesai: endStr });
        }
    };

    const applyFilter = (override = {}) => {
        const query = {
            jenis: override.jenis !== undefined ? override.jenis : jenis,
            tanggal_mulai: override.tanggal_mulai !== undefined ? override.tanggal_mulai : tanggalMulai,
            tanggal_selesai: override.tanggal_selesai !== undefined ? override.tanggal_selesai : tanggalSelesai,
            loket_id: override.loket_id !== undefined ? override.loket_id : loketId,
            status: override.status !== undefined ? override.status : status,
            search: override.search !== undefined ? override.search : search,
        };

        // Remove empty keys
        Object.keys(query).forEach((k) => {
            if (!query[k]) delete query[k];
        });

        router.get(route('laporan.index'), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        setJenis('antrean');
        setTanggalMulai(todayStr);
        setTanggalSelesai(todayStr);
        setLoketId('');
        setStatus('');
        setSearch('');

        router.get(route('laporan.index'), {
            jenis: 'antrean',
            tanggal_mulai: todayStr,
            tanggal_selesai: todayStr,
        });
    };

    const handleSwitchJenis = (newJenis) => {
        setJenis(newJenis);
        applyFilter({ jenis: newJenis });
    };

    const getBuildUrl = (routeName) => {
        const params = new URLSearchParams();
        if (jenis) params.set('jenis', jenis);
        if (tanggalMulai) params.set('tanggal_mulai', tanggalMulai);
        if (tanggalSelesai) params.set('tanggal_selesai', tanggalSelesai);
        if (loketId) params.set('loket_id', loketId);
        if (status) params.set('status', status);
        if (search) params.set('search', search);

        return `${route(routeName)}?${params.toString()}`;
    };

    const handlePrint = () => {
        window.open(getBuildUrl('laporan.cetak'), '_blank');
    };

    const handleExport = () => {
        window.location.href = getBuildUrl('laporan.export');
    };

    return (
        <HospitalLayout
            user={auth.user}
            header="Laporan & Rekapitulasi Pelayanan Farmasi"
            description="Pantau performa, waktu tunggu, durasi pelayanan, serta rekapitulasi data antrean farmasi"
            fluid={true}
        >
            <Head title="Laporan & Rekapitulasi Farmasi" />

            <div className="space-y-5">
                {/* Header Action Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Alur Selector Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => handleSwitchJenis('antrean')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                jenis === 'antrean'
                                    ? 'bg-white text-emerald-800 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Alur 1: Karcis Antrean Farmasi</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSwitchJenis('pasien')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                jenis === 'pasien'
                                    ? 'bg-white text-purple-800 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5 text-purple-600" />
                            <span>Alur 2: Pasien SIMRS</span>
                        </button>
                    </div>

                    {/* Action Buttons: Cetak & Export */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                        <button
                            type="button"
                            onClick={handleExport}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
                            title="Download rekap data antrean format CSV / Excel"
                        >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Export CSV / Excel</span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-2xs hover:shadow transition cursor-pointer"
                            title="Buka pratinjau cetak laporan resmi RS"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Laporan</span>
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                            <Filter className="w-4 h-4 text-emerald-600" />
                            <span>Filter & Periode Laporan</span>
                        </div>

                        {/* Date Preset Shortcuts */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-slate-400 text-[11px] mr-1">Preset:</span>
                            <button
                                type="button"
                                onClick={() => setPresetDate('hari_ini')}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 transition"
                            >
                                Hari Ini
                            </button>
                            <button
                                type="button"
                                onClick={() => setPresetDate('kemarin')}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 transition"
                            >
                                Kemarin
                            </button>
                            <button
                                type="button"
                                onClick={() => setPresetDate('7_hari')}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 transition"
                            >
                                7 Hari Terakhir
                            </button>
                            <button
                                type="button"
                                onClick={() => setPresetDate('bulan_ini')}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 transition"
                            >
                                Bulan Ini
                            </button>
                        </div>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter();
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
                    >
                        {/* Tanggal Mulai */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={tanggalMulai}
                                onChange={(e) => setTanggalMulai(e.target.value)}
                                className="w-full text-xs font-mono rounded-xl border-slate-200 shadow-2xs focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Tanggal Selesai */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                value={tanggalSelesai}
                                onChange={(e) => setTanggalSelesai(e.target.value)}
                                className="w-full text-xs font-mono rounded-xl border-slate-200 shadow-2xs focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Loket */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Loket Farmasi
                            </label>
                            <select
                                value={loketId}
                                onChange={(e) => setLoketId(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-200 shadow-2xs focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">Semua Loket</option>
                                {lokets.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.nama} ({l.prefix})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Status Antrean
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-200 shadow-2xs focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">Semua Status</option>
                                <option value="selesai">Selesai</option>
                                <option value="terlewat">Terlewat</option>
                                <option value="menunggu">Menunggu</option>
                                <option value="dipanggil">Dipanggil / Dilayani</option>
                                <option value="batal">Batal</option>
                            </select>
                        </div>

                        {/* Search Input */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Pencarian
                            </label>
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="No. Antrean / Pasien / RM"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full text-xs pl-8 rounded-xl border-slate-200 shadow-2xs focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Submit & Reset Buttons */}
                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span>Terapkan</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                title="Reset Filter"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* KPI Metrics Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Card 1: Total */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Total Antrean</span>
                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                <Ticket className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="font-mono text-2xl font-black text-slate-900">
                            {stats.total.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Pada periode terpilih</div>
                    </div>

                    {/* Card 2: Selesai */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Selesai Dilayani</span>
                            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="font-mono text-2xl font-black text-emerald-600">
                            {stats.selesai.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                            {stats.total > 0 ? `${Math.round((stats.selesai / stats.total) * 100)}% dari total` : '-'}
                        </div>
                    </div>

                    {/* Card 3: Terlewat */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Terlewat</span>
                            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                                <SkipForward className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="font-mono text-2xl font-black text-amber-600">
                            {stats.terlewat.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                            {stats.total > 0 ? `${Math.round((stats.terlewat / stats.total) * 100)}% dari total` : '-'}
                        </div>
                    </div>

                    {/* Card 4: Rata Tunggu */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Rata-rata Tunggu</span>
                            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="font-mono text-2xl font-black text-sky-700">
                            {stats.avgWaitMinutes} <span className="text-xs font-normal">mnt</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Dari daftar s/d panggil</div>
                    </div>

                    {/* Card 5: Rata Layanan */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between text-slate-500 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Rata Layanan</span>
                            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="font-mono text-2xl font-black text-purple-700">
                            {stats.avgServiceMinutes} <span className="text-xs font-normal">mnt</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Dari panggil s/d selesai</div>
                    </div>
                </div>

                {/* Loket Volume Breakdown Bar */}
                {loketStats && loketStats.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <span className="flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-emerald-600" />
                                Distribusi Pelayanan per Loket
                            </span>
                            <span className="text-slate-400 text-[11px] font-normal normal-case">
                                Total {stats.total} antrean
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {loketStats.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-7 h-7 rounded-lg text-white font-mono font-black text-xs flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: item.warna || '#10b981' }}
                                        >
                                            {item.prefix}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-800 truncate" title={item.nama}>
                                                {item.nama}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                {item.percentage}% dari total
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-mono font-black text-sm text-slate-800 shrink-0">
                                        {item.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Data Rinci Antrean ({reportData.total || 0} Record)
                        </div>
                        <div className="text-[11px] text-slate-400">
                            Menampilkan halaman {reportData.current_page || 1} dari {reportData.last_page || 1}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                                    <th className="p-3 pl-4 text-center w-12">No</th>
                                    <th className="p-3">{jenis === 'pasien' ? 'Waktu Panggil' : 'Tanggal & Nomor'}</th>
                                    <th className="p-3">Loket</th>
                                    <th className="p-3">Pasien / No. RM</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3">{jenis === 'pasien' ? 'Selesai' : 'Waktu Panggil & Selesai'}</th>
                                    <th className="p-3 text-right">{jenis === 'pasien' ? 'Durasi Layanan' : 'Waktu Tunggu'}</th>
                                    <th className="p-3 text-right">{jenis === 'pasien' ? 'Panggilan' : 'Durasi Layanan'}</th>
                                    <th className="p-3 pr-4">Petugas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.data && reportData.data.length > 0 ? (
                                    reportData.data.map((row, idx) => {
                                        const globalIndex = ((reportData.current_page || 1) - 1) * (reportData.per_page || 25) + idx + 1;

                                        let waktuTunggu = '-';
                                        if (row.waktu_daftar && row.waktu_panggil) {
                                            const diff = Math.round(
                                                (new Date(row.waktu_panggil).getTime() - new Date(row.waktu_daftar).getTime()) / 60000
                                            );
                                            waktuTunggu = `${diff} mnt`;
                                        }

                                        let durasiLayanan = '-';
                                        if (row.waktu_panggil && row.waktu_selesai) {
                                            const diff = Math.round(
                                                (new Date(row.waktu_selesai).getTime() - new Date(row.waktu_panggil).getTime()) / 60000
                                            );
                                            durasiLayanan = `${diff} mnt`;
                                        }

                                        return (
                                            <tr key={row.id} className="hover:bg-slate-50/60 transition">
                                                <td className="p-3 pl-4 text-center font-mono text-slate-400 text-[11px]">
                                                    {globalIndex}
                                                </td>

                                                {/* Tanggal & Nomor */}
                                                <td className="p-3">
                                                    {jenis === 'pasien' ? (
                                                        <span className="font-mono text-slate-700">
                                                            {row.waktu_panggil ? new Date(row.waktu_panggil).toLocaleString('id-ID') : '-'}
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                                                                {row.nomor}
                                                            </span>
                                                            <span className="font-mono text-[11px] text-slate-500">
                                                                {row.tanggal}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Loket */}
                                                <td className="p-3">
                                                    <span className="font-bold text-slate-700">
                                                        {row.loket?.nama || `Loket ${row.prefix || '-'}`}
                                                    </span>
                                                </td>

                                                {/* Pasien & RM */}
                                                <td className="p-3">
                                                    <div>
                                                        <span className="font-bold text-slate-800 uppercase">
                                                            {row.nama_pasien || '-'}
                                                        </span>
                                                        {row.no_rkm_medis && (
                                                            <span className="block text-[10px] font-mono text-slate-400">
                                                                RM: {row.no_rkm_medis}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="p-3 text-center">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            row.status === 'selesai'
                                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                                : row.status === 'terlewat'
                                                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                                : row.status === 'menunggu'
                                                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                                : row.status === 'dipanggil' || row.status === 'dilayani'
                                                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                                                        }`}
                                                    >
                                                        {row.status}
                                                    </span>
                                                </td>

                                                {/* Waktu Pelayanan */}
                                                <td className="p-3 font-mono text-[11px] text-slate-600">
                                                    {jenis === 'pasien' ? (
                                                        row.waktu_selesai ? new Date(row.waktu_selesai).toLocaleTimeString('id-ID') : '-'
                                                    ) : (
                                                        <div>
                                                            <div>Panggil: {row.waktu_panggil ? new Date(row.waktu_panggil).toLocaleTimeString('id-ID') : '-'}</div>
                                                            <div className="text-slate-400 text-[10px]">Selesai: {row.waktu_selesai ? new Date(row.waktu_selesai).toLocaleTimeString('id-ID') : '-'}</div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Durasi Tunggu */}
                                                <td className="p-3 text-right font-mono font-bold text-slate-700">
                                                    {jenis === 'pasien' ? durasiLayanan : waktuTunggu}
                                                </td>

                                                {/* Durasi Layanan / Panggilan */}
                                                <td className="p-3 text-right font-mono text-slate-600">
                                                    {jenis === 'pasien' ? `${row.jumlah_panggilan || 0}x` : durasiLayanan}
                                                </td>

                                                {/* Petugas */}
                                                <td className="p-3 pr-4 text-slate-600">
                                                    {row.petugas?.name || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                                            Tidak ada data antrean pada periode dan filter yang dipilih.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {reportData.links && reportData.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs text-slate-500">
                                Menampilkan {reportData.from || 0} sampai {reportData.to || 0} dari total {reportData.total || 0} data
                            </div>
                            <div className="flex items-center gap-1">
                                {reportData.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        preserveState
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                            link.active
                                                ? 'bg-emerald-600 text-white'
                                                : link.url
                                                ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                                : 'text-slate-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </HospitalLayout>
    );
}
