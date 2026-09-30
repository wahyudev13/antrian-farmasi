import React, { useState } from 'react';
import HospitalLayout from '@/Layouts/HospitalLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Ticket,
    PlusCircle,
    Search,
    Clock,
    User,
    Layers,
    Filter,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    XCircle,
    Printer
} from 'lucide-react';

export default function AntreanIndex({ auth, antreans, filters, stats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'semua');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('antrean.index'),
            { search, status: statusFilter },
            { preserveState: true, replace: true }
        );
    };

    const handleFilterStatus = (newStatus) => {
        setStatusFilter(newStatus);
        router.get(
            route('antrean.index'),
            { search, status: newStatus },
            { preserveState: true, replace: true }
        );
    };

    const handleCancel = (id, nomor) => {
        if (confirm(`Yakin ingin membatalkan antrean nomor ${nomor}?`)) {
            router.delete(route('antrean.destroy', id));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'menunggu':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Menunggu
                    </span>
                );
            case 'dipanggil':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                        Dipanggil
                    </span>
                );
            case 'dilayani':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Sedang Dilayani
                    </span>
                );
            case 'selesai':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <CheckCircle className="w-3 h-3 text-slate-500" />
                        Selesai
                    </span>
                );
            case 'terlewat':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Terlewat
                    </span>
                );
            case 'batal':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                        <XCircle className="w-3 h-3 text-gray-400" />
                        Batal
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    return (
        <HospitalLayout
            user={auth.user}
            header="Daftar Antrean Farmasi Hari Ini"
            description="Monitoring seluruh antrean resep dan status pelayanan farmasi hari ini"
        >
            <Head title="Daftar Antrean Farmasi" />

            <div className="space-y-6">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <span className="text-xs font-semibold text-slate-500 block">Total Antrean</span>
                        <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{stats.total}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-4 shadow-xs">
                        <span className="text-xs font-semibold text-amber-700 block">Menunggu</span>
                        <span className="text-2xl font-black text-amber-600 mt-1 block font-mono">{stats.menunggu}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-blue-200 bg-blue-50/20 p-4 shadow-xs">
                        <span className="text-xs font-semibold text-blue-700 block">Dipanggil</span>
                        <span className="text-2xl font-black text-blue-600 mt-1 block font-mono">{stats.dipanggil}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-xs">
                        <span className="text-xs font-semibold text-emerald-700 block">Dilayani</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block font-mono">{stats.dilayani}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <span className="text-xs font-semibold text-slate-600 block">Selesai</span>
                        <span className="text-2xl font-black text-slate-700 mt-1 block font-mono">{stats.selesai}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/20 p-4 shadow-xs">
                        <span className="text-xs font-semibold text-rose-700 block">Terlewat</span>
                        <span className="text-2xl font-black text-rose-600 mt-1 block font-mono">{stats.terlewat}</span>
                    </div>
                </div>

                {/* Main Filter & Action Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="w-full sm:w-80 relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nomor / nama pasien..."
                                className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                            />
                        </form>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <Link
                                href={route('pemanggilan.index')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition shadow-xs"
                            >
                                <Megaphone className="w-4 h-4 text-emerald-600" />
                                <span>Buka Meja Pemanggilan</span>
                            </Link>

                            <Link
                                href={route('antrean.create')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition"
                            >
                                <PlusCircle className="w-4 h-4" />
                                <span>+ Buat Antrean</span>
                            </Link>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                        {['semua', 'menunggu', 'dipanggil', 'dilayani', 'selesai', 'terlewat'].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => handleFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition whitespace-nowrap ${
                                    statusFilter === s
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Nomor</th>
                                    <th className="py-3 px-4">Pasien</th>
                                    <th className="py-3 px-4">Tujuan Loket</th>
                                    <th className="py-3 px-4">Waktu Daftar</th>
                                    <th className="py-3 px-4">Panggilan</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {antreans.data.map((antrean) => (
                                    <tr key={antrean.id} className="hover:bg-slate-50/70 transition">
                                        <td className="py-3 px-4 font-mono font-black text-emerald-700 text-base">
                                            {antrean.nomor}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-slate-800 uppercase">
                                                {antrean.nama_pasien || (
                                                    <span className="text-slate-400 font-normal italic text-xs">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                            {antrean.no_rkm_medis || antrean.no_rawat ? (
                                                <div className="text-xs text-slate-400 font-mono">
                                                    {antrean.no_rkm_medis ? `RM: ${antrean.no_rkm_medis}` : antrean.no_rawat}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="py-3 px-4">
                                            {antrean.loket ? (
                                                <span className="font-semibold text-slate-700">
                                                    {antrean.loket.nama}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Semua Loket</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-xs font-mono text-slate-500">
                                            {new Date(antrean.waktu_daftar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                                            {antrean.jumlah_panggilan}x
                                        </td>
                                        <td className="py-3 px-4">
                                            {getStatusBadge(antrean.status)}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(route('antrean.cetak', antrean.id), '_blank', 'width=450,height=650')}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-2xs"
                                                    title="Cetak Karcis Tiket"
                                                >
                                                    <Printer className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Cetak</span>
                                                </button>

                                                {antrean.status === 'menunggu' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancel(antrean.id, antrean.nomor)}
                                                        className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline ml-1"
                                                    >
                                                        Batalkan
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {antreans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                                            Tidak ada data antrean yang cocok dengan pencarian / filter ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {antreans.links && antreans.links.length > 3 && (
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-slate-500">
                                Menampilkan {antreans.from || 0} - {antreans.to || 0} dari total {antreans.total} antrean
                            </span>
                            <div className="flex items-center gap-1">
                                {antreans.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                                            link.active
                                                ? 'bg-emerald-600 text-white font-bold'
                                                : link.url
                                                ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                : 'text-slate-300 pointer-events-none'
                                        }`}
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
