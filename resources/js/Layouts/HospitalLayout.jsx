import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Ticket,
    PlusCircle,
    ListOrdered,
    Megaphone,
    UserCheck,
    Layers,
    Users,
    Settings,
    FileText,
    Monitor,
    LogOut,
    Menu,
    X,
    Building2,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ExternalLink,
    Shield,
    Volume2
} from 'lucide-react';

export default function HospitalLayout({ title, header, children, fluid = false }) {
    const { auth, pengaturan, flash } = usePage().props;
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                return localStorage.getItem('sidebar_collapsed') === 'true';
            } catch (e) {
                return false;
            }
        }
        return false;
    });
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [isTestingAudio, setIsTestingAudio] = useState(false);
    const [testSentSuccess, setTestSentSuccess] = useState(false);

    React.useEffect(() => {
        try {
            localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
        } catch (e) {
            // Ignore storage errors
        }
    }, [sidebarCollapsed]);

    const toggleSidebar = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen((prev) => !prev);
        } else {
            setSidebarCollapsed((prev) => !prev);
        }
    };

    const handleTestAudio = async () => {
        if (isTestingAudio) return;
        setIsTestingAudio(true);
        setTestSentSuccess(false);

        try {
            if (window.axios) {
                await window.axios.post('/display/test-sound');
            } else {
                await fetch('/display/test-sound', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Accept': 'application/json',
                    },
                });
            }
            setTestSentSuccess(true);
        } catch (e) {
            // Ignore error
        } finally {
            setIsTestingAudio(false);
            setTimeout(() => {
                setTestSentSuccess(false);
            }, 3000);
        }
    };

    const [toastNotification, setToastNotification] = useState(null);
    const [toastVisible, setToastVisible] = useState(false);

    React.useEffect(() => {
        const msg = flash?.success || flash?.error || flash?.warning;
        if (msg) {
            setToastNotification({
                type: flash?.success ? 'success' : flash?.error ? 'error' : 'warning',
                text: msg,
                id: Date.now(),
            });
            setToastVisible(true);
            const timer = setTimeout(() => {
                setToastVisible(false);
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error, flash?.warning]);

    const hospitalName = pengaturan?.nama_rumah_sakit || 'RS PKU MUHAMMADIYAH SEKAPUK';
    const unitName = pengaturan?.nama_unit || 'Instalasi Farmasi';
    const logoUrl = pengaturan?.logo_url;

    const isAdmin = user?.role === 'admin';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
                <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-hidden"
                            title={sidebarCollapsed ? 'Tampilkan Sidebar' : 'Sembunyikan Sidebar'}
                            aria-label="Toggle Sidebar"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt="Logo RS"
                                    className="h-10 w-auto object-contain max-w-[130px]"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                    <Building2 className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight">
                                    {hospitalName}
                                </h1>
                                <p className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
                                    {unitName}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Test Sound Display Button */}
                        <button
                            type="button"
                            onClick={handleTestAudio}
                            disabled={isTestingAudio}
                            title="Kirim perintah tes suara lonceng & panggilan ke layar display antrean (TV)"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition shadow-2xs ${
                                testSentSuccess
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : isTestingAudio
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse cursor-wait'
                                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 cursor-pointer'
                            }`}
                        >
                            <Volume2 className={`w-3.5 h-3.5 ${
                                testSentSuccess
                                    ? 'text-emerald-700'
                                    : isTestingAudio
                                    ? 'text-amber-800 animate-bounce'
                                    : 'text-amber-700'
                            }`} />
                            <span>
                                {testSentSuccess
                                    ? 'Sinyal Terkirim ke Display ✓'
                                    : isTestingAudio
                                    ? 'Mengirim ke Display...'
                                    : 'Tes Suara Display'}
                            </span>
                        </button>

                        {/* Quick link to Display Screen */}
                        <a
                            href="/display"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition shadow-2xs"
                        >
                            <Monitor className="w-4 h-4 text-emerald-600" />
                            <span>Buka Layar Display</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>

                        {/* User Profile / Status */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition focus:outline-hidden"
                            >
                                <div className="h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="text-sm font-semibold text-slate-800 leading-tight">
                                        {user?.name}
                                    </div>
                                    <div className="text-xs text-slate-500 capitalize flex items-center gap-1">
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                        {user?.role}
                                    </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
                            </button>

                            {userDropdownOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                    onClick={() => setUserDropdownOpen(false)}
                                >
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-xs text-slate-500">Masuk sebagai</p>
                                        <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>
                                        <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 uppercase">
                                            Peran: {user?.role}
                                        </span>
                                    </div>
                                    <Link
                                        href={route('profile.edit')}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        <Shield className="w-4 h-4 text-slate-400" />
                                        <span>Profil Pengguna</span>
                                    </Link>
                                    <Link
                                        method="post"
                                        href={route('logout')}
                                        as="button"
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Keluar Sistem</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Backdrop on mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar Navigation */}
                <aside
                    className={`fixed lg:static inset-y-0 left-0 z-30 bg-white border-r border-slate-200/80 flex flex-col transition-all duration-300 ease-in-out ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } ${
                        sidebarCollapsed ? 'lg:w-0 lg:overflow-hidden lg:border-r-0 lg:opacity-0' : 'w-64 lg:opacity-100'
                    }`}
                >
                    <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                        {/* Main Menu */}
                        <div className="space-y-1">
                            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Menu Utama
                            </p>
                            <Link
                                href={route('dashboard')}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                    route().current('dashboard')
                                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span>Dashboard</span>
                            </Link>
                        </div>

                        {/* Pelayanan Antrean Farmasi */}
                        <div className="space-y-1">
                            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Pelayanan Farmasi
                            </p>
                            <Link
                                href={route('pemanggilan.index')}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                    route().current('pemanggilan.index') || route().current('antrean.create')
                                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Megaphone className="w-5 h-5" />
                                <span>Panggil & Buat Antrean</span>
                            </Link>
                            <Link
                                href={route('pemanggilan.pasien.index')}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                    route().current('pemanggilan.pasien.*')
                                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <UserCheck className="w-5 h-5" />
                                <span>Panggil Pasien (SIMRS)</span>
                            </Link>
                            <Link
                                href={route('antrean.index')}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                    route().current('antrean.index')
                                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <ListOrdered className="w-5 h-5" />
                                <span>Riwayat Data Tiket</span>
                            </Link>
                        </div>

                        {/* Master Data */}
                        {isAdmin && (
                            <div className="space-y-1">
                                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Master Data
                                </p>
                                <Link
                                    href={route('loket.index')}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                        route().current('loket.*')
                                            ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <Layers className="w-5 h-5" />
                                    <span>Master Loket</span>
                                </Link>
                                <Link
                                    href={route('pengaturan.index')}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                        route().current('pengaturan.*')
                                            ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <Settings className="w-5 h-5" />
                                    <span>Pengaturan & Logo</span>
                                </Link>
                            </div>
                        )}

                        {/* Layar & Laporan */}
                        <div className="space-y-1">
                            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Publik & Laporan
                            </p>
                            <a
                                href="/display"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <Monitor className="w-5 h-5 text-emerald-600" />
                                    <span>Layar Display</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                            <Link
                                href={route('laporan.index')}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                                    route().current('laporan.*')
                                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <FileText className="w-5 h-5" />
                                <span>Laporan & Rekapitulasi</span>
                            </Link>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 text-xs text-slate-500">
                        <div className="flex items-center justify-between font-medium text-slate-700 mb-1">
                            <span>Sistem Antrean Farmasi</span>
                            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-sm">v1.0</span>
                        </div>
                        <p className="truncate text-slate-400">{hospitalName}</p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto">
                    {/* Header */}
                    {header && (
                        <div className="bg-white border-b border-slate-200/80 px-4 py-5 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    )}

                    {/* Page Content */}
                    <div className={`${fluid ? 'w-full px-3 sm:px-5 lg:px-6 py-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}`}>
                        {children}
                    </div>
                </main>
            </div>

            {/* Floating Toast Notification (Directly at Root Level - Never shifts layout) */}
            {toastVisible && toastNotification && (
                <div
                    key={toastNotification.id}
                    className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-200 pointer-events-auto"
                >
                    {toastNotification.type === 'success' && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-emerald-950 bg-white border border-emerald-300 rounded-2xl shadow-2xl shadow-emerald-950/20">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-slate-800 leading-snug">{toastNotification.text}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setToastVisible(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 ml-1.5 cursor-pointer"
                                title="Tutup notifikasi"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {toastNotification.type === 'error' && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-rose-950 bg-white border border-rose-300 rounded-2xl shadow-2xl shadow-rose-950/20">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-slate-800 leading-snug">{toastNotification.text}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setToastVisible(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 ml-1.5 cursor-pointer"
                                title="Tutup notifikasi"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {toastNotification.type === 'warning' && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-amber-950 bg-white border border-amber-300 rounded-2xl shadow-2xl shadow-amber-950/20">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-slate-800 leading-snug">{toastNotification.text}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setToastVisible(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 ml-1.5 cursor-pointer"
                                title="Tutup notifikasi"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
