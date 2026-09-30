import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { User, Lock, Tv, AlertCircle } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { pengaturan } = usePage().props;
    const hospitalName = pengaturan?.nama_rumah_sakit || 'RS PKU MUHAMMADIYAH SEKAPUK';
    const unitName = pengaturan?.nama_unit || 'Instalasi Farmasi';

    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <GuestLayout>
            <Head title="Masuk Sistem Antrean" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                    Sistem Antrean Farmasi
                </h1>
                <p className="mt-1 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    {hospitalName}
                </p>
                {unitName && (
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {unitName}
                    </p>
                )}
            </div>

            {status && (
                <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    {status}
                </div>
            )}

            {/* Error Notification Alert */}
            {hasErrors && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>Validasi Login Gagal</span>
                    </div>
                    <p className="mt-1 text-rose-700">
                        {errors.username || errors.password || 'Periksa kembali data akun yang Anda masukkan.'}
                    </p>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="username" value="Username" className="font-semibold text-slate-700 text-xs" />

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <User className="w-4 h-4" />
                        </div>
                        <TextInput
                            id="username"
                            type="text"
                            name="username"
                            value={data.username}
                            placeholder="Ketik username Anda..."
                            className={`block w-full pl-9 rounded-xl transition ${
                                errors.username 
                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' 
                                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                            }`}
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('username', e.target.value)}
                        />
                    </div>

                    <InputError message={errors.username} className="mt-1 text-xs" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Kata Sandi (Password)" className="font-semibold text-slate-700 text-xs" />

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                        </div>
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            placeholder="••••••••"
                            className={`block w-full pl-9 rounded-xl transition ${
                                errors.password 
                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' 
                                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                            }`}
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>

                    <InputError message={errors.password} className="mt-1 text-xs" />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center cursor-pointer select-none">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ms-2 text-xs text-slate-600">
                            Ingat saya di perangkat ini
                        </span>
                    </label>
                </div>

                <div className="pt-2">
                    <PrimaryButton
                        className="w-full justify-center rounded-xl bg-slate-900 py-3 text-xs font-black tracking-wider uppercase text-white shadow-md hover:bg-slate-800 active:bg-slate-950 transition"
                        disabled={processing}
                    >
                        {processing ? 'Memproses Masuk...' : 'MASUK KE APLIKASI'}
                    </PrimaryButton>
                </div>
            </form>

            <div className="mt-6 text-center pt-4 border-t border-slate-100">
                <Link
                    href={route('display.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline transition"
                >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Lihat Layar Display Antrean Publik</span>
                </Link>
            </div>
        </GuestLayout>
    );
}
