<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loket extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'lokets';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'kode',
        'nama',
        'prefix',
        'nomor_display',
        'warna',
        'status',
        'urutan',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'nomor_display' => 'integer',
            'urutan' => 'integer',
        ];
    }

    /**
     * Scope query to only include active lokets.
     *
     * @param  Builder<Loket>  $query
     */
    public function scopeAktif(Builder $query): void
    {
        $query->where('status', 'aktif');
    }

    /**
     * Scope query ordered by display sequence.
     *
     * @param  Builder<Loket>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('urutan', 'asc')->orderBy('id', 'asc');
    }

    /**
     * Queue tickets assigned to this loket.
     *
     * @return HasMany<Antrean, $this>
     */
    public function antreans(): HasMany
    {
        return $this->hasMany(Antrean::class, 'loket_id');
    }

    /**
     * Queue calls made at this loket.
     *
     * @return HasMany<AntreanCall, $this>
     */
    public function antreanCalls(): HasMany
    {
        return $this->hasMany(AntreanCall::class, 'loket_id');
    }

    /**
     * Patient calls made at this loket.
     *
     * @return HasMany<PanggilanPasien, $this>
     */
    public function panggilanPasiens(): HasMany
    {
        return $this->hasMany(PanggilanPasien::class, 'loket_id');
    }

    /**
     * Patient call logs made at this loket.
     *
     * @return HasMany<PanggilanPasienLog, $this>
     */
    public function panggilanPasienLogs(): HasMany
    {
        return $this->hasMany(PanggilanPasienLog::class, 'loket_id');
    }
}
