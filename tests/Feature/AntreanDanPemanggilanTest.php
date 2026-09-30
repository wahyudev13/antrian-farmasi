<?php

namespace Tests\Feature;

use App\Models\Antrean;
use App\Models\Loket;
use App\Models\Pengaturan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AntreanDanPemanggilanTest extends TestCase
{
    use RefreshDatabase;

    private User $petugas;

    private Loket $loket;

    protected function setUp(): void
    {
        parent::setUp();

        $this->petugas = User::factory()->create([
            'role' => 'petugas',
            'status' => 'aktif',
        ]);

        $this->loket = Loket::create([
            'kode' => 'L01',
            'nama' => 'Loket 1',
            'prefix' => 'A',
            'nomor_display' => 1,
            'status' => 'aktif',
            'urutan' => 1,
        ]);

        Pengaturan::set('queue_prefix', 'A');
        Pengaturan::set('queue_padding', '3');
    }

    public function test_guest_is_redirected_from_antrean_and_pemanggilan(): void
    {
        $this->get(route('antrean.index'))->assertRedirect(route('login'));
        $this->get(route('pemanggilan.index'))->assertRedirect(route('login'));
    }

    public function test_petugas_can_view_antrean_index_and_create(): void
    {
        $response = $this->actingAs($this->petugas)->get(route('antrean.index'));
        $response->assertStatus(200);

        $responseCreate = $this->actingAs($this->petugas)->get(route('antrean.create'));
        $responseCreate->assertRedirect(route('pemanggilan.index'));
    }

    public function test_petugas_can_create_new_antrean(): void
    {
        $response = $this->actingAs($this->petugas)
            ->from(route('pemanggilan.index'))
            ->post(route('antrean.store'), [
                'nama_pasien' => 'Siti Aminah',
                'no_rawat' => '2026/09/23/001',
                'no_rkm_medis' => '123456',
                'jenis_kelamin' => 'P',
            ]);

        $response->assertRedirect(route('pemanggilan.index'));

        $this->assertDatabaseHas('antreans', [
            'nama_pasien' => 'Siti Aminah',
            'nomor' => 'A001',
            'nomor_urut' => 1,
            'status' => 'menunggu',
        ]);
    }

    public function test_petugas_can_create_antrean_without_nama_pasien(): void
    {
        $response = $this->actingAs($this->petugas)
            ->from(route('pemanggilan.index'))
            ->post(route('antrean.store'), [
                'loket_id' => $this->loket->id,
            ]);

        $response->assertRedirect(route('pemanggilan.index'));

        $this->assertDatabaseHas('antreans', [
            'nama_pasien' => null,
            'nomor' => 'A001',
            'status' => 'menunggu',
        ]);
    }

    public function test_petugas_can_call_next_antrean_at_loket(): void
    {
        $antrean = Antrean::create([
            'tanggal' => Carbon::today()->toDateString(),
            'prefix' => 'A',
            'nomor' => 'A001',
            'nomor_urut' => 1,
            'nama_pasien' => 'Ahmad Dahlan',
            'status' => 'menunggu',
            'waktu_daftar' => now(),
            'jumlah_panggilan' => 0,
        ]);

        $response = $this->actingAs($this->petugas)->post(route('pemanggilan.next'), [
            'loket_id' => $this->loket->id,
        ]);

        $response->assertSessionHas('called_audio');

        $this->assertDatabaseHas('antreans', [
            'id' => $antrean->id,
            'status' => 'dipanggil',
            'loket_id' => $this->loket->id,
            'jumlah_panggilan' => 1,
        ]);

        $this->assertDatabaseHas('antrean_calls', [
            'antrean_id' => $antrean->id,
            'loket_id' => $this->loket->id,
            'nomor_panggilan' => 1,
        ]);
    }

    public function test_petugas_can_call_direct_patient(): void
    {
        $response = $this->actingAs($this->petugas)->post(route('pemanggilan.pasien.store'), [
            'nama_pasien' => 'Budi Santoso',
            'loket_id' => $this->loket->id,
            'no_rawat' => '2026/09/23/002',
        ]);

        $response->assertSessionHas('called_audio');

        $this->assertDatabaseHas('panggilan_pasien', [
            'nama_pasien' => 'Budi Santoso',
            'loket_id' => $this->loket->id,
            'status' => 'dipanggil',
            'jumlah_panggilan' => 1,
        ]);
    }

    public function test_display_status_json_api_returns_latest_state(): void
    {
        Antrean::create([
            'tanggal' => Carbon::today()->toDateString(),
            'prefix' => 'A',
            'nomor' => 'A001',
            'nomor_urut' => 1,
            'nama_pasien' => 'Joko Widodo',
            'status' => 'dipanggil',
            'loket_id' => $this->loket->id,
            'waktu_daftar' => now(),
            'waktu_panggil' => now(),
            'jumlah_panggilan' => 1,
        ]);

        $response = $this->get(route('display.status'));
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'lokets',
            'currentCall' => [
                'type',
                'call_key',
                'nomor',
                'nama',
                'loket',
                'nomor_display',
            ],
            'server_time',
        ]);
    }

    public function test_antrean_nomor_urut_increments_sequentially_without_duplicate(): void
    {
        $today = Carbon::today()->toDateString();

        $t1 = $this->actingAs($this->petugas)
            ->post(route('antrean.store'), [
                'loket_id' => $this->loket->id,
                'nama_pasien' => 'Pasien Pertama',
            ]);
        $t1->assertSessionHas('success');

        $t2 = $this->actingAs($this->petugas)
            ->post(route('antrean.store'), [
                'loket_id' => $this->loket->id,
                'nama_pasien' => 'Pasien Kedua',
            ]);
        $t2->assertSessionHas('success');

        $this->assertDatabaseHas('antreans', [
            'tanggal' => $today,
            'loket_id' => $this->loket->id,
            'nomor_urut' => 1,
            'nomor' => 'A001',
        ]);

        $this->assertDatabaseHas('antreans', [
            'tanggal' => $today,
            'loket_id' => $this->loket->id,
            'nomor_urut' => 2,
            'nomor' => 'A002',
        ]);

        $this->assertEquals(2, Antrean::whereDate('tanggal', $today)->where('loket_id', $this->loket->id)->count());
    }

    public function test_quick_issue_anti_double_click_prevents_duplicate_number(): void
    {
        $today = Carbon::today()->toDateString();

        // 1st request succeeds
        $res1 = $this->actingAs($this->petugas)
            ->post(route('antrean.store'), [
                'loket_id' => $this->loket->id,
            ]);
        $res1->assertSessionHas('success');

        // 2nd immediate request within the lock window prevents duplicate ticket
        $res2 = $this->actingAs($this->petugas)
            ->post(route('antrean.store'), [
                'loket_id' => $this->loket->id,
            ]);
        $res2->assertSessionHas('warning');

        // Total created ticket should still be only 1
        $this->assertEquals(1, Antrean::whereDate('tanggal', $today)->where('loket_id', $this->loket->id)->count());
    }

    public function test_admin_cannot_create_loket_with_duplicate_prefix(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'aktif']);

        $response = $this->actingAs($admin)
            ->post(route('loket.store'), [
                'kode' => 'L99',
                'nama' => 'Loket Duplikat',
                'prefix' => $this->loket->prefix, // same prefix 'A'
                'nomor_display' => 10,
                'status' => 'aktif',
                'urutan' => 10,
            ]);

        $response->assertSessionHasErrors('prefix');
    }
}
