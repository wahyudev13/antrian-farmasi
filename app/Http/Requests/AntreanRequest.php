<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AntreanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama_pasien' => ['nullable', 'string', 'max:255'],
            'no_rawat' => ['nullable', 'string', 'max:50'],
            'no_rkm_medis' => ['nullable', 'string', 'max:30'],
            'jenis_kelamin' => ['nullable', 'in:L,P'],
            'tanggal_lahir' => ['nullable', 'date'],
            'loket_id' => ['nullable', 'exists:lokets,id'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nama_pasien.max' => 'Nama pasien maksimal 255 karakter.',
            'no_rawat.max' => 'Nomor rawat maksimal 50 karakter.',
            'no_rkm_medis.max' => 'Nomor rekam medis maksimal 30 karakter.',
            'jenis_kelamin.in' => 'Pilihan jenis kelamin hanya Laki-laki (L) atau Perempuan (P).',
            'tanggal_lahir.date' => 'Format tanggal lahir tidak valid.',
            'loket_id.exists' => 'Loket yang dipilih tidak ditemukan dalam sistem.',
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
            'nama_pasien' => 'Nama Pasien',
            'no_rawat' => 'Nomor Rawat',
            'no_rkm_medis' => 'Nomor Rekam Medis',
            'jenis_kelamin' => 'Jenis Kelamin',
            'tanggal_lahir' => 'Tanggal Lahir',
            'loket_id' => 'Tujuan Loket',
        ];
    }
}
