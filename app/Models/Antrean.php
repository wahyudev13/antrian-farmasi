<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Antrean extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'antreans';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tanggal',
        'prefix',
        'nomor',
        'nomor_urut',
        'no_rawat',
        'no_rkm_medis',
        'nama_pasien',
        'jenis_kelamin',
        'tanggal_lahir',
        'loket_id',
        'status',
        'waktu_daftar',
        'waktu_panggil',
        'waktu_selesai',
        'jumlah_panggilan',
        'petugas_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'tanggal_lahir' => 'date',
            'nomor_urut' => 'integer',
            'jumlah_panggilan' => 'integer',
            'waktu_daftar' => 'datetime',
            'waktu_panggil' => 'datetime',
            'waktu_selesai' => 'datetime',
        ];
    }

    /**
     * Scope query to only today's queue tickets.
     *
     * @param  Builder<Antrean>  $query
     */
    public function scopeHariIni(Builder $query, ?string $tanggal = null): void
    {
        $date = $tanggal ?? Carbon::today()->toDateString();
        $query->whereDate('tanggal', $date);
    }

    /**
     * Scope query for waiting tickets.
     *
     * @param  Builder<Antrean>  $query
     */
    public function scopeMenunggu(Builder $query): void
    {
        $query->where('status', 'menunggu');
    }

    /**
     * Scope query for currently called tickets.
     *
     * @param  Builder<Antrean>  $query
     */
    public function scopeDipanggil(Builder $query): void
    {
        $query->where('status', 'dipanggil');
    }

    /**
     * Loket where the ticket is served.
     *
     * @return BelongsTo<Loket, $this>
     */
    public function loket(): BelongsTo
    {
        return $this->belongsTo(Loket::class, 'loket_id');
    }

    /**
     * Staff handling this ticket.
     *
     * @return BelongsTo<User, $this>
     */
    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }

    /**
     * Call history logs for this ticket.
     *
     * @return HasMany<AntreanCall, $this>
     */
    public function calls(): HasMany
    {
        return $this->hasMany(AntreanCall::class, 'antrean_id');
    }

    /**
     * Format name with privacy protection.
     */
    public function formatNamaForDisplay(string $mode = 'masked'): string
    {
        $nama = trim($this->nama_pasien);
        if (empty($nama)) {
            return '';
        }

        if ($mode === 'full') {
            return strtoupper($nama);
        }

        if ($mode === 'initials') {
            $words = explode(' ', $nama);
            $initials = array_map(function ($word) {
                return ! empty($word) ? strtoupper(mb_substr($word, 0, 1)).'.' : '';
            }, $words);

            return implode(' ', array_filter($initials));
        }

        // Default 'masked': e.g. "Budi Santoso" -> "BUDI S******"
        $words = explode(' ', $nama);
        if (count($words) === 1) {
            $len = mb_strlen($words[0]);
            if ($len <= 3) {
                return strtoupper($words[0]);
            }

            return strtoupper(mb_substr($words[0], 0, 3)).str_repeat('*', max(1, $len - 3));
        }

        $firstWord = strtoupper($words[0]);
        $maskedRemaining = [];
        for ($i = 1; $i < count($words); $i++) {
            $w = $words[$i];
            if (mb_strlen($w) > 0) {
                $maskedRemaining[] = strtoupper(mb_substr($w, 0, 1)).str_repeat('*', max(3, mb_strlen($w) - 1));
            }
        }

        return $firstWord.' '.implode(' ', $maskedRemaining);
    }
}
