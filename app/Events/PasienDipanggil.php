<?php

namespace App\Events;

use App\Models\PanggilanPasien;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PasienDipanggil implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The call payload.
     *
     * @var array<string, mixed>
     */
    public array $callData;

    /**
     * Create a new event instance.
     */
    public function __construct(PanggilanPasien $panggilan)
    {
        $panggilan->load('loket');

        $this->callData = [
            'type' => 'pasien',
            'id' => $panggilan->id,
            'nomor' => null,
            'nama' => $panggilan->nama_pasien,
            'loket_id' => $panggilan->loket_id,
            'loket' => $panggilan->loket?->nama ?? 'Loket Farmasi',
            'nomor_display' => $panggilan->loket?->nomor_display ?? 1,
            'jumlah_panggilan' => $panggilan->jumlah_panggilan,
            'timestamp' => now()->timestamp,
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('farmasi-display'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'pasien.dipanggil';
    }
}
