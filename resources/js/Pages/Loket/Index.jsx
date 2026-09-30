import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import HospitalLayout from '@/Layouts/HospitalLayout';
import {
    Layers,
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    ArrowUpDown,
    Tv,
    Hash,
    Building,
    Palette,
    X
} from 'lucide-react';

export default function LoketIndex({ lokets }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLoket, setEditingLoket] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        kode: '',
        nama: '',
        prefix: 'A',
        nomor_display: 1,
        warna: '#2563eb',
        status: 'aktif',
        urutan: 1,
    });

    const openCreateModal = () => {
        setEditingLoket(null);
        clearErrors();
        const nextUrutan = lokets.length > 0 ? Math.max(...lokets.map(l => l.urutan)) + 1 : 1;
        const nextNumber = lokets.length > 0 ? Math.max(...lokets.map(l => l.nomor_display)) + 1 : 1;
        const codePadding = String(nextNumber).padStart(2, '0');
        const defaultPrefixes = ['A', 'B', 'C', 'D', 'E'];
        const nextPrefix = defaultPrefixes[lokets.length] || 'A';
        const defaultColors = ['#2563eb', '#059669', '#f59e0b', '#7c3aed', '#e11d48', '#0891b2'];
        const nextColor = defaultColors[lokets.length % defaultColors.length] || '#2563eb';
        setData({
            kode: `L${codePadding}`,
            nama: `Loket ${nextNumber}`,
            prefix: nextPrefix,
            nomor_display: nextNumber,
            warna: nextColor,
            status: 'aktif',
            urutan: nextUrutan,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (loket) => {
        setEditingLoket(loket);
        clearErrors();
        setData({
            kode: loket.kode,
            nama: loket.nama,
            prefix: loket.prefix || 'A',
            nomor_display: loket.nomor_display,
            warna: loket.warna || '#2563eb',
            status: loket.status,
            urutan: loket.urutan,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLoket(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingLoket) {
            put(route('loket.update', editingLoket.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('loket.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleToggleStatus = (loket) => {
        router.patch(route('loket.toggle', loket.id), {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (loket) => {
        if (confirm(`Apakah Anda yakin ingin menghapus "${loket.nama}" (${loket.kode})?`)) {
            router.delete(route('loket.destroy', loket.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <HospitalLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                            <Layers className="w-4 h-4" />
                            <span>Master Data</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Kelola Loket Farmasi
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Konfigurasi loket panggilan yang dinamis, nomor display, status aktif, dan urutan layanan.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-xs shadow-emerald-200"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Loket Baru</span>
                    </button>
                </div>
            }
        >
            <Head title="Kelola Loket" />

            {/* Lokets Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                            Daftar Loket Pelayanan ({lokets.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            Loket berstatus aktif akan muncul pada menu pemanggilan dan layar display farmasi.
                        </p>
                    </div>
                </div>

                {lokets.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-semibold text-slate-700">Belum ada data loket</p>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                            Klik tombol di bawah untuk membuat loket pelayanan pertama.
                        </p>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Loket</span>
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4">Urutan</th>
                                    <th className="py-3 px-4">Kode Loket</th>
                                    <th className="py-3 px-4">Nama Loket</th>
                                    <th className="py-3 px-4">Warna Card</th>
                                    <th className="py-3 px-4">Prefix Antrean</th>
                                    <th className="py-3 px-4">Nomor Display</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lokets.map((loket) => (
                                    <tr
                                        key={loket.id}
                                        className="hover:bg-slate-50/70 transition-colors"
                                    >
                                        <td className="py-3 px-4 font-mono font-medium text-slate-500 text-xs">
                                            #{loket.urutan}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                                {loket.kode}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-slate-800">
                                                {loket.nama}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-bold">
                                                <span
                                                    className="w-4 h-4 rounded-full shadow-2xs shrink-0 border border-black/10"
                                                    style={{ backgroundColor: loket.warna || '#2563eb' }}
                                                />
                                                <span>{loket.warna || '#2563eb'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                                Prefix {loket.prefix || 'A'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-100">
                                                <Tv className="w-3.5 h-3.5 text-sky-600" />
                                                <span>Layar {loket.nomor_display}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(loket)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                                                    loket.status === 'aktif'
                                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                                }`}
                                                title="Klik untuk mengubah status"
                                            >
                                                {loket.status === 'aktif' ? (
                                                    <>
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>Aktif</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                        <span>Nonaktif</span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(loket)}
                                                    className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition"
                                                    title="Ubah Loket"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(loket)}
                                                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                                                    title="Hapus Loket"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Dialog Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-base">
                                    {editingLoket ? 'Ubah Data Loket' : 'Tambah Loket Baru'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Kode Loket */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Kode Loket <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.kode}
                                    onChange={(e) => setData('kode', e.target.value.toUpperCase())}
                                    placeholder="Contoh: L01, L02, RA"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm font-mono"
                                    required
                                />
                                {errors.kode && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.kode}</p>
                                )}
                            </div>

                            {/* Nama Loket */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Nama Loket <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    placeholder="Contoh: Loket 1, Loket Racikan, Loket BPJS"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm"
                                    required
                                />
                                {errors.nama && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.nama}</p>
                                )}
                            </div>

                            {/* Prefix Antrean Huruf */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Prefix Antrean <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength="5"
                                    value={data.prefix}
                                    onChange={(e) => setData('prefix', e.target.value.toUpperCase())}
                                    placeholder="Contoh: A, B, R, NR"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm font-mono font-bold"
                                    required
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Huruf awalan nomor tiket untuk loket ini (contoh: <strong>A</strong> untuk Non Racikan, <strong>B</strong> untuk Racikan).
                                </p>
                                {errors.prefix && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.prefix}</p>
                                )}
                            </div>

                            {/* Warna Card Display */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                                    <span>Warna Card Display</span>
                                    <span className="text-[11px] font-normal text-slate-400">Pilih warna banner & card</span>
                                </label>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="relative shrink-0">
                                        <input
                                            type="color"
                                            value={data.warna}
                                            onChange={(e) => setData('warna', e.target.value)}
                                            className="w-11 h-10 p-1 rounded-xl border border-slate-300 cursor-pointer bg-white"
                                            title="Klik untuk memilih warna bebas"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={data.warna}
                                        onChange={(e) => setData('warna', e.target.value)}
                                        placeholder="#2563EB"
                                        maxLength="10"
                                        className="w-28 px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm font-mono uppercase font-bold"
                                    />
                                    {/* Color preview banner */}
                                    <div
                                        className="flex-1 px-3 py-2 rounded-xl text-white text-xs font-black uppercase text-center shadow-xs truncate"
                                        style={{ backgroundColor: data.warna || '#2563eb' }}
                                    >
                                        {data.nama || 'Preview Card'}
                                    </div>
                                </div>
                                {/* Quick Preset Buttons */}
                                <div className="flex items-center gap-2 mt-2 pt-1 flex-wrap">
                                    <span className="text-[11px] text-slate-500 font-medium">Pilihan cepat:</span>
                                    {[
                                        { label: 'Biru RS', hex: '#2563eb' },
                                        { label: 'Hijau', hex: '#059669' },
                                        { label: 'Kuning / Amber', hex: '#f59e0b' },
                                        { label: 'Ungu', hex: '#7c3aed' },
                                        { label: 'Merah', hex: '#e11d48' },
                                        { label: 'Cyan / Toska', hex: '#0891b2' },
                                        { label: 'Abu-Abu', hex: '#475569' },
                                    ].map((c) => (
                                        <button
                                            key={c.hex}
                                            type="button"
                                            onClick={() => setData('warna', c.hex)}
                                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                                data.warna?.toLowerCase() === c.hex.toLowerCase()
                                                    ? 'scale-125 border-slate-900 shadow-sm ring-2 ring-emerald-300'
                                                    : 'border-white hover:scale-110 shadow-2xs'
                                            }`}
                                            style={{ backgroundColor: c.hex }}
                                            title={`${c.label} (${c.hex})`}
                                        />
                                    ))}
                                </div>
                                {errors.warna && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.warna}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Nomor Display */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Nomor Display
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.nomor_display}
                                        onChange={(e) => setData('nomor_display', parseInt(e.target.value) || 1)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm"
                                        required
                                    />
                                    {errors.nomor_display && (
                                        <p className="text-xs text-rose-600 mt-1">{errors.nomor_display}</p>
                                    )}
                                </div>

                                {/* Urutan Tampilan */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Urutan
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.urutan}
                                        onChange={(e) => setData('urutan', parseInt(e.target.value) || 1)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm"
                                        required
                                    />
                                    {errors.urutan && (
                                        <p className="text-xs text-rose-600 mt-1">{errors.urutan}</p>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Status Layanan
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm bg-white"
                                >
                                    <option value="aktif">Aktif (Dapat Melayani Panggilan)</option>
                                    <option value="nonaktif">Nonaktif (Tutup / Istirahat)</option>
                                </select>
                                {errors.status && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.status}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition disabled:opacity-50 shadow-xs shadow-emerald-200"
                                >
                                    {processing ? 'Menyimpan...' : (editingLoket ? 'Perbarui Loket' : 'Simpan Loket')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </HospitalLayout>
    );
}
