<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PengaturanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama_rumah_sakit' => ['required', 'string', 'max:255'],
            'nama_unit' => ['required', 'string', 'max:255'],
            'alamat_rs' => ['nullable', 'string', 'max:500'],
            'running_text' => ['nullable', 'string', 'max:1000'],
            'queue_prefix' => ['nullable', 'string', 'max:5'],
            'queue_padding' => ['required', 'integer', 'min:1', 'max:6'],
            'daily_reset' => ['required', 'in:0,1'],
            'display_privacy_mode' => ['nullable', 'in:full,masked,initials'],
            'template_suara_antrean' => ['nullable', 'string', 'max:500'],
            'template_suara_pasien' => ['nullable', 'string', 'max:500'],
            'tts_kecepatan' => ['nullable', 'numeric', 'min:0.5', 'max:2.0'],
            'tts_nada' => ['nullable', 'numeric', 'min:0.5', 'max:2.0'],
            'tts_volume' => ['nullable', 'numeric', 'min:0.0', 'max:1.0'],
            'cetak_ukuran_kertas' => ['nullable', 'in:58mm,80mm'],
            'cetak_format_nomor' => ['nullable', 'in:dash,standard'],
            'cetak_jumlah_lembar' => ['nullable', 'in:1,2,3,4'],
            'cetak_label_rangkap' => ['nullable', 'in:0,1'],
            'logo_file' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nama_rumah_sakit.required' => 'Nama rumah sakit wajib diisi.',
            'nama_rumah_sakit.max' => 'Nama rumah sakit maksimal 255 karakter.',
            'nama_unit.required' => 'Nama unit layanan wajib diisi.',
            'nama_unit.max' => 'Nama unit layanan maksimal 255 karakter.',
            'queue_prefix.required' => 'Prefix antrean wajib diisi (misal: A, B, atau F).',
            'queue_prefix.max' => 'Prefix antrean maksimal 5 karakter.',
            'queue_padding.required' => 'Jumlah digit nomor antrean wajib diisi.',
            'queue_padding.integer' => 'Jumlah digit harus berupa angka bulat.',
            'queue_padding.min' => 'Jumlah digit nomor antrean minimal 1 digit.',
            'queue_padding.max' => 'Jumlah digit nomor antrean maksimal 6 digit.',
            'daily_reset.required' => 'Pilihan reset harian harus ditentukan.',
            'daily_reset.in' => 'Pilihan reset harian tidak valid.',
            'display_privacy_mode.required' => 'Mode privasi tampilan harus dipilih.',
            'display_privacy_mode.in' => 'Mode privasi harus salah satu dari: full, masked, atau initials.',
            'logo_file.image' => 'File logo harus berupa gambar visual.',
            'logo_file.mimes' => 'Format file logo yang diizinkan hanya: PNG, JPG, JPEG, SVG, atau WEBP.',
            'logo_file.max' => 'Ukuran file logo maksimal adalah 2MB (2048 KB).',
        ];
    }

    /**
     * Custom attribute names for validation errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nama_rumah_sakit' => 'Nama Rumah Sakit',
            'nama_unit' => 'Nama Unit Layanan',
            'alamat_rs' => 'Alamat Instansi',
            'running_text' => 'Teks Berjalan',
            'queue_prefix' => 'Prefix Nomor Antrean',
            'queue_padding' => 'Digit Angka Nomor Antrean',
            'daily_reset' => 'Reset Harian',
            'display_privacy_mode' => 'Mode Privasi Nama Display',
            'logo_file' => 'File Logo Rumah Sakit',
        ];
    }
}
