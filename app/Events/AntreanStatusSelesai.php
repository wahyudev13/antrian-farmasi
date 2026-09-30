<?php

namespace App\Events;

use App\Models\Antrean;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AntreanStatusSelesai implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The event payload.
     *
     * @var array<string, mixed>
     */
    public array $callData;

    /**
     * Create a new event instance.
     */
    public function __construct(Antrean $antrean)
    {
        $this->callData = [
            'id' => $antrean->id,
            'nomor' => $antrean->nomor,
            'loket_id' => $antrean->loket_id,
            'status' => 'selesai',
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
        return 'antrean.selesai';
    }
}
