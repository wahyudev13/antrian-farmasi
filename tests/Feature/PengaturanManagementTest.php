<?php

namespace Tests\Feature;

use App\Models\Pengaturan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PengaturanManagementTest extends TestCase
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

    public function test_guest_is_redirected_from_pengaturan(): void
    {
        $response = $this->get(route('pengaturan.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_petugas_cannot_access_pengaturan(): void
    {
        $response = $this->actingAs($this->petugas)->get(route('pengaturan.index'));

        $response->assertStatus(403);
    }

    public function test_admin_can_view_pengaturan(): void
    {
        $response = $this->actingAs($this->admin)->get(route('pengaturan.index'));

        $response->assertStatus(200);
    }

    public function test_admin_can_update_hospital_name_and_settings(): void
    {
        $payload = [
            'nama_rumah_sakit' => 'RS PKU TEST CLINIC',
            'nama_unit' => 'Farmasi Rawat Jalan',
            'alamat_rs' => 'Jl. Test No. 99',
            'running_text' => 'Pemberitahuan: Harap tunggu nomor Anda.',
            'queue_prefix' => 'B',
            'queue_padding' => 4,
            'daily_reset' => '1',
            'display_privacy_mode' => 'initials',
        ];

        $response = $this->actingAs($this->admin)->post(route('pengaturan.update'), $payload);

        $response->assertRedirect(route('pengaturan.index'));
        $this->assertEquals('RS PKU TEST CLINIC', Pengaturan::get('nama_rumah_sakit'));
        $this->assertEquals('Farmasi Rawat Jalan', Pengaturan::get('nama_unit'));
        $this->assertEquals('B', Pengaturan::get('queue_prefix'));
        $this->assertEquals('initials', Pengaturan::get('display_privacy_mode'));
    }

    public function test_admin_can_upload_and_delete_hospital_logo(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('hospital_logo.png', 400, 400);

        $payload = [
            'nama_rumah_sakit' => 'RS PKU SEKAPUK',
            'nama_unit' => 'Instalasi Farmasi',
            'queue_prefix' => 'A',
            'queue_padding' => 3,
            'daily_reset' => '1',
            'display_privacy_mode' => 'masked',
            'logo_file' => $file,
        ];

        $response = $this->actingAs($this->admin)->post(route('pengaturan.update'), $payload);

        $response->assertRedirect(route('pengaturan.index'));

        $savedPath = Pengaturan::get('logo_rs');
        $this->assertNotNull($savedPath);
        Storage::disk('public')->assertExists($savedPath);

        // Test delete logo
        $deleteResponse = $this->actingAs($this->admin)->delete(route('pengaturan.destroy-logo'));
        $deleteResponse->assertRedirect(route('pengaturan.index'));

        $this->assertNull(Pengaturan::get('logo_rs'));
        Storage::disk('public')->assertMissing($savedPath);
    }

    public function test_public_display_can_be_accessed_by_guests(): void
    {
        $response = $this->get(route('display.index'));

        $response->assertStatus(200);
    }
}
