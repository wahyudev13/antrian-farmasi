<?php

namespace Tests\Feature;

use App\Models\Loket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoketManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $petugas;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'aktif',
        ]);

        $this->petugas = User::factory()->create([
            'role' => 'petugas',
            'status' => 'aktif',
        ]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get(route('loket.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_petugas_cannot_access_loket_management(): void
    {
        $response = $this->actingAs($this->petugas)->get(route('loket.index'));

        $response->assertStatus(403);
    }

    public function test_admin_can_view_loket_list(): void
    {
        Loket::create([
            'kode' => 'L01',
            'nama' => 'Loket 1',
            'nomor_display' => 1,
            'status' => 'aktif',
            'urutan' => 1,
        ]);

        $response = $this->actingAs($this->admin)->get(route('loket.index'));

        $response->assertStatus(200);
    }

    public function test_admin_can_create_new_loket(): void
    {
        $payload = [
            'kode' => 'L09',
            'nama' => 'Loket Racikan',
            'prefix' => 'B',
            'nomor_display' => 9,
            'status' => 'aktif',
            'urutan' => 9,
        ];

        $response = $this->actingAs($this->admin)->post(route('loket.store'), $payload);

        $response->assertRedirect(route('loket.index'));
        $this->assertDatabaseHas('lokets', [
            'kode' => 'L09',
            'nama' => 'Loket Racikan',
            'prefix' => 'B',
        ]);
    }

    public function test_admin_cannot_create_duplicate_kode_loket(): void
    {
        Loket::create([
            'kode' => 'L01',
            'nama' => 'Loket 1',
            'prefix' => 'A',
            'nomor_display' => 1,
            'status' => 'aktif',
            'urutan' => 1,
        ]);

        $payload = [
            'kode' => 'L01',
            'nama' => 'Loket Duplikat',
            'prefix' => 'A',
            'nomor_display' => 2,
            'status' => 'aktif',
            'urutan' => 2,
        ];

        $response = $this->actingAs($this->admin)->post(route('loket.store'), $payload);

        $response->assertSessionHasErrors(['kode']);
    }

    public function test_admin_can_update_loket(): void
    {
        $loket = Loket::create([
            'kode' => 'L01',
            'nama' => 'Loket Lama',
            'prefix' => 'A',
            'nomor_display' => 1,
            'status' => 'aktif',
            'urutan' => 1,
        ]);

        $response = $this->actingAs($this->admin)->put(route('loket.update', $loket->id), [
            'kode' => 'L01',
            'nama' => 'Loket Diperbarui',
            'prefix' => 'C',
            'nomor_display' => 5,
            'status' => 'aktif',
            'urutan' => 1,
        ]);

        $response->assertRedirect(route('loket.index'));
        $this->assertDatabaseHas('lokets', [
            'id' => $loket->id,
            'nama' => 'Loket Diperbarui',
            'prefix' => 'C',
            'nomor_display' => 5,
        ]);
    }

    public function test_admin_can_toggle_loket_status(): void
    {
        $loket = Loket::create([
            'kode' => 'L01',
            'nama' => 'Loket 1',
            'nomor_display' => 1,
            'status' => 'aktif',
            'urutan' => 1,
        ]);

        $response = $this->actingAs($this->admin)->patch(route('loket.toggle', $loket->id));

        $response->assertRedirect(route('loket.index'));
        $this->assertDatabaseHas('lokets', [
            'id' => $loket->id,
            'status' => 'nonaktif',
        ]);
    }

    public function test_admin_can_delete_loket(): void
    {
        $loket = Loket::create([
            'kode' => 'L01',
            'nama' => 'Loket 1',
            'nomor_display' => 1,
            'status' => 'aktif',
            'urutan' => 1,
        ]);

        $response = $this->actingAs($this->admin)->delete(route('loket.destroy', $loket->id));

        $response->assertRedirect(route('loket.index'));
        $this->assertDatabaseMissing('lokets', [
            'id' => $loket->id,
        ]);
    }
}
