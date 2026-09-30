<?php

namespace App\Http\Middleware;

use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $settings = Pengaturan::getAllSettings();
        $logoUrl = null;
        if (! empty($settings['logo_rs'])) {
            $logoUrl = Storage::disk('public')->url($settings['logo_rs']);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'pengaturan' => [
                ...$settings,
                'logo_url' => $logoUrl,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'latest_antrean' => fn () => $request->session()->get('latest_antrean'),
                'called_audio' => fn () => $request->session()->get('called_audio'),
            ],
        ];
    }
}
