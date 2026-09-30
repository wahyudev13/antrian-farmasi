<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Pengaturan extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'pengaturans';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
        'deskripsi',
    ];

    /**
     * Get a setting value by key with caching.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("setting_{$key}", 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();

            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Set a setting value by key and invalidate cache.
     */
    public static function set(string $key, mixed $value, ?string $deskripsi = null): void
    {
        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'deskripsi' => $deskripsi ?? static::where('key', $key)->value('deskripsi'),
            ]
        );

        Cache::forget("setting_{$key}");
        Cache::forget('all_app_settings');
    }

    /**
     * Get all settings as key-value pairs with caching.
     *
     * @return array<string, mixed>
     */
    public static function getAllSettings(): array
    {
        return Cache::remember('all_app_settings', 3600, function () {
            $settings = static::all();
            $result = [
                'nama_rumah_sakit' => 'RS PKU SEKAPUK',
                'nama_unit' => 'Instalasi Farmasi',
                'logo_rs' => null,
                'alamat_rs' => 'Jl. Deandles No. 1, Sekapuk, Ujungpangkah, Gresik',
                'running_text' => 'Selamat Datang di Instalasi Farmasi. Silakan perhatikan panggilan nomor antrean Anda.',
                'queue_prefix' => 'A',
                'queue_padding' => '3',
                'daily_reset' => '1',
                'display_privacy_mode' => 'masked',
                'template_suara_antrean' => 'Nomor antrean, {nomor}, silakan menuju {loket}',
                'template_suara_pasien' => 'Pasien atas nama, {nama}, silakan menuju {loket}',
                'tts_kecepatan' => '0.9',
                'tts_nada' => '1.0',
                'tts_volume' => '1.0',
                'cetak_ukuran_kertas' => '80mm',
                'cetak_format_nomor' => 'dash',
                'cetak_jumlah_lembar' => '1',
                'cetak_label_rangkap' => '1',
            ];

            foreach ($settings as $setting) {
                $result[$setting->key] = $setting->value;
            }

            return $result;
        });
    }
}
