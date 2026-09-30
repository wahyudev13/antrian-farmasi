import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import HospitalLayout from '@/Layouts/HospitalLayout';
import {
    Ticket,
    UserCheck,
    Layers,
    Monitor,
    Clock,
    CheckCircle2,
    Volume2,
    ArrowRight,
    Building2,
    Settings,
    Activity
} from 'lucide-react';

export default function Dashboard({ antreanStats, pasienStats, totalLoket }) {
    const { auth, pengaturan } = usePage().props;
    const user = auth?.user;
    const isAdmin = user?.role === 'admin';

    const hospitalName = pengaturan?.nama_rumah_sakit || 'RS PKU MUHAMMADIYAH SEKAPUK';
    const unitName = pengaturan?.nama_unit || 'Instalasi Farmasi';

    return (
        <HospitalLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                            <Activity className="w-4 h-4" />
                            <span>Panel Monitoring</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Selamat Datang, {user?.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {hospitalName} — {unitName}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="/display"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-emerald-200"
                        >
                            <Monitor className="w-4 h-4" />
                            <span>Buka Layar Display Farmasi</span>
                        </a>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Status Sistem Info Banner */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 text-base">{hospitalName}</h3>
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                    Tahap 3 Lengkap: Laporan Aktif
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Sistem antrean farmasi terpadu: loket pelayanan, pemanggilan display audio, dan laporan rekapitulasi.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('laporan.index')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                        >
                            Buka Laporan
                        </Link>
                        {isAdmin && (
                            <>
                                <Link
                                    href={route('loket.index')}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                                >
                                    Kelola Loket
                                </Link>
                                <Link
                                    href={route('pengaturan.index')}
                                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                                >
                                    Pengaturan
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* 2 Alur Utama Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Alur 1: Panggil Antrean */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                                    <Ticket className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">
                                        Alur 1: Nomor Antrean Farmasi
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                        Menggunakan nomor tiket (A001, A002...)
                                    </p>
                                </div>
                            </div>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                Aktif
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium">Menunggu</p>
                                <p className="text-xl font-black text-slate-800 mt-1 font-mono">{antreanStats?.menunggu || 0}</p>
                            </div>
                            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                                <p className="text-xs text-sky-700 font-medium">Dipanggil</p>
                                <p className="text-xl font-black text-sky-900 mt-1 font-mono">{antreanStats?.dipanggil || 0}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <p className="text-xs text-emerald-700 font-medium">Selesai</p>
                                <p className="text-xl font-black text-emerald-900 mt-1 font-mono">{antreanStats?.selesai || 0}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Link
                                href={route('antrean.create')}
                                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition"
                            >
                                + Buat Antrean
                            </Link>
                            <Link
                                href={route('pemanggilan.index')}
                                className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs text-center transition shadow-xs"
                            >
                                Buka Pemanggilan &rarr;
                            </Link>
                        </div>
                    </div>

                    {/* Alur 2: Panggil Pasien Langsung */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">
                                        Alur 2: Panggil Nama Pasien
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                        Panggilan langsung nama pasien untuk penyerahan obat
                                    </p>
                                </div>
                            </div>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                Aktif
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                <p className="text-xs text-purple-700 font-medium">Dipanggil</p>
                                <p className="text-xl font-black text-purple-900 mt-1 font-mono">{pasienStats?.dipanggil || 0}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <p className="text-xs text-emerald-700 font-medium">Selesai</p>
                                <p className="text-xl font-black text-emerald-900 mt-1 font-mono">{pasienStats?.selesai || 0}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium">Total Hari Ini</p>
                                <p className="text-xl font-black text-slate-800 mt-1 font-mono">{pasienStats?.total || 0}</p>
                            </div>
                        </div>

                        <div className="pt-1">
                            <Link
                                href={route('pemanggilan.pasien.index')}
                                className="block w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs text-center transition shadow-xs"
                            >
                                Buka Panggilan Pasien &rarr;
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link
                        href={route('loket.index')}
                        className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                                <Layers className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Master Loket</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Atur loket pemanggilan farmasi, nomor display, dan status aktif.
                        </p>
                    </Link>

                    <Link
                        href={route('pengaturan.index')}
                        className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
                                <Settings className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Pengaturan & Logo RS</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Upload logo rumah sakit, atur nama resmi, dan mode privasi.
                        </p>
                    </Link>

                    <a
                        href="/display"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Layar Display Publik</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Layar pemanggilan antrean untuk ruang tunggu pasien farmasi.
                        </p>
                    </a>
                </div>
            </div>
        </HospitalLayout>
    );
}
