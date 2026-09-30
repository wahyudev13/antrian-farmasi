<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PanggilanPasienLog extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'panggilan_pasien_logs';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'panggilan_pasien_id',
        'loket_id',
        'petugas_id',
        'nomor_panggilan',
        'waktu_panggilan',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'nomor_panggilan' => 'integer',
            'waktu_panggilan' => 'datetime',
        ];
    }

    /**
     * Associated patient call record.
     *
     * @return BelongsTo<PanggilanPasien, $this>
     */
    public function panggilanPasien(): BelongsTo
    {
        return $this->belongsTo(PanggilanPasien::class, 'panggilan_pasien_id');
    }

    /**
     * Loket where the call was made.
     *
     * @return BelongsTo<Loket, $this>
     */
    public function loket(): BelongsTo
    {
        return $this->belongsTo(Loket::class, 'loket_id');
    }

    /**
     * Staff who made the call.
     *
     * @return BelongsTo<User, $this>
     */
    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }
}
