<?php

namespace App\Events;

use App\Models\Antrean;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AntreanDipanggil implements ShouldBroadcastNow
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
    public function __construct(Antrean $antrean)
    {
        $antrean->load('loket');

        $this->callData = [
            'type' => 'antrean',
            'id' => $antrean->id,
            'nomor' => $antrean->nomor,
            'nama' => $antrean->nama_pasien,
            'loket_id' => $antrean->loket_id,
            'loket' => $antrean->loket?->nama ?? 'Loket Farmasi',
            'nomor_display' => $antrean->loket?->nomor_display ?? 1,
            'jumlah_panggilan' => $antrean->jumlah_panggilan,
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
        return 'antrean.dipanggil';
    }
}
