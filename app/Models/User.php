<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Determine if user has administrator role.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Determine if user has petugas role.
     */
    public function isPetugas(): bool
    {
        return $this->role === 'petugas';
    }

    /**
     * Determine if user status is aktif.
     */
    public function isAktif(): bool
    {
        return $this->status === 'aktif';
    }

    /**
     * Queue tickets created/handled by user.
     *
     * @return HasMany<Antrean, $this>
     */
    public function antreans(): HasMany
    {
        return $this->hasMany(Antrean::class, 'petugas_id');
    }

    /**
     * Queue call logs made by user.
     *
     * @return HasMany<AntreanCall, $this>
     */
    public function antreanCalls(): HasMany
    {
        return $this->hasMany(AntreanCall::class, 'petugas_id');
    }

    /**
     * Direct patient calls handled by user.
     *
     * @return HasMany<PanggilanPasien, $this>
     */
    public function panggilanPasiens(): HasMany
    {
        return $this->hasMany(PanggilanPasien::class, 'petugas_id');
    }

    /**
     * Direct patient call logs made by user.
     *
     * @return HasMany<PanggilanPasienLog, $this>
     */
    public function panggilanPasienLogs(): HasMany
    {
        return $this->hasMany(PanggilanPasienLog::class, 'petugas_id');
    }
}
