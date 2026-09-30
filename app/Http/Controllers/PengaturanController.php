<?php

namespace App\Http\Controllers;

use App\Http\Requests\PengaturanRequest;
use App\Models\Pengaturan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanController extends Controller
{
    /**
     * Display settings page.
     */
    public function index(): Response
    {
        $settings = Pengaturan::getAllSettings();
        $logoUrl = null;
        if (! empty($settings['logo_rs'])) {
            $logoUrl = Storage::disk('public')->url($settings['logo_rs']);
        }

        return Inertia::render('Pengaturan/Index', [
            'settings' => $settings,
            'logoUrl' => $logoUrl,
        ]);
    }

    /**
     * Update hospital settings & upload logo.
     */
    public function update(PengaturanRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('logo_file')) {
            $oldLogo = Pengaturan::get('logo_rs');
            if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                Storage::disk('public')->delete($oldLogo);
            }

            $path = $request->file('logo_file')->store('logos', 'public');
            Pengaturan::set('logo_rs', $path, 'Path File Logo Rumah Sakit');
        }

        $keys = [
            'nama_rumah_sakit',
            'nama_unit',
            'alamat_rs',
            'running_text',
            'queue_prefix',
            'queue_padding',
            'daily_reset',
            'display_privacy_mode',
            'template_suara_antrean',
            'template_suara_pasien',
            'tts_kecepatan',
            'tts_nada',
            'tts_volume',
            'cetak_ukuran_kertas',
            'cetak_format_nomor',
            'cetak_jumlah_lembar',
            'cetak_label_rangkap',
        ];

        foreach ($keys as $key) {
            if (array_key_exists($key, $validated)) {
                Pengaturan::set($key, (string) $validated[$key]);
            }
        }

        return redirect()->route('pengaturan.index')->with('success', 'Pengaturan aplikasi dan logo berhasil diperbarui.');
    }

    /**
     * Delete existing hospital logo.
     */
    public function hapusLogo(): RedirectResponse
    {
        $oldLogo = Pengaturan::get('logo_rs');
        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        Pengaturan::set('logo_rs', null);

        return redirect()->route('pengaturan.index')->with('success', 'Logo rumah sakit berhasil dihapus.');
    }
}
