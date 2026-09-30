<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LoketRequest extends FormRequest
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
        $loketId = $this->route('loket')?->id ?? $this->input('id');

        return [
            'kode' => [
                'required',
                'string',
                'max:20',
                Rule::unique('lokets', 'kode')->ignore($loketId),
            ],
            'nama' => ['required', 'string', 'max:100'],
            'prefix' => [
                'required',
                'string',
                'max:5',
                Rule::unique('lokets', 'prefix')->ignore($loketId),
            ],
            'nomor_display' => ['required', 'integer', 'min:1'],
            'warna' => ['nullable', 'string', 'max:30'],
            'status' => ['required', 'in:aktif,nonaktif'],
            'urutan' => ['required', 'integer', 'min:1'],
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
            'kode.required' => 'Kode loket wajib diisi.',
            'kode.unique' => 'Kode loket ini sudah digunakan oleh loket lain.',
            'kode.max' => 'Kode loket maksimal 20 karakter.',
            'nama.required' => 'Nama loket wajib diisi.',
            'nama.max' => 'Nama loket maksimal 100 karakter.',
            'prefix.required' => 'Prefix antrean wajib diisi (misal: A, B, atau C).',
            'prefix.unique' => 'Prefix antrean ini sudah digunakan oleh loket lain. Setiap loket harus memiliki prefix huruf yang berbeda agar nomor antrean tidak bentrok atau dobel.',
            'prefix.max' => 'Prefix antrean maksimal 5 karakter.',
            'nomor_display.required' => 'Nomor display wajib diisi.',
            'nomor_display.integer' => 'Nomor display harus berupa angka bilangan bulat.',
            'nomor_display.min' => 'Nomor display minimal adalah 1.',
            'status.required' => 'Status loket harus ditentukan.',
            'status.in' => 'Status loket hanya boleh aktif atau nonaktif.',
            'urutan.required' => 'Urutan tampilan wajib diisi.',
            'urutan.integer' => 'Urutan tampilan harus berupa angka bilangan bulat.',
            'urutan.min' => 'Urutan tampilan minimal adalah 1.',
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
            'kode' => 'Kode Loket',
            'nama' => 'Nama Loket',
            'prefix' => 'Prefix Antrean',
            'nomor_display' => 'Nomor Display',
            'status' => 'Status Loket',
            'urutan' => 'Urutan Tampilan',
        ];
    }
}
