<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AntreanCall extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'antrean_calls';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'antrean_id',
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
     * Associated queue ticket.
     *
     * @return BelongsTo<Antrean, $this>
     */
    public function antrean(): BelongsTo
    {
        return $this->belongsTo(Antrean::class, 'antrean_id');
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
     * Staff who called the ticket.
     *
     * @return BelongsTo<User, $this>
     */
    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }
}
