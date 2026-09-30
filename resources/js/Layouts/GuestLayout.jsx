import { Link, usePage } from '@inertiajs/react';
import { Building2 } from 'lucide-react';

export default function GuestLayout({ children }) {
    const { pengaturan } = usePage().props;
    const logoUrl = pengaturan?.logo_url;
    const hospitalName = pengaturan?.nama_rumah_sakit || 'RS PKU MUHAMMADIYAH SEKAPUK';

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100/80 p-4 sm:p-6">
            <div className="mb-5 flex flex-col items-center">
                <Link href="/" className="flex flex-col items-center group">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={hospitalName}
                            className="h-20 w-auto object-contain max-w-[240px] drop-shadow-sm transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                            <Building2 className="w-9 h-9" />
                        </div>
                    )}
                </Link>
            </div>

            <div className="w-full overflow-hidden bg-white p-6 sm:p-8 shadow-xl border border-slate-200/80 rounded-3xl sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
