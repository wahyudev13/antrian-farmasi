<?php

namespace Tests\Feature;

use App\Models\Antrean;
use App\Models\Loket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LaporanTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Loket $loket;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->loket = Loket::create([
            'nama' => 'Loket Non Racikan',
            'kode' => 'L01',
            'prefix' => 'A',
            'nomor_display' => 1,
            'warna' => '#10b981',
            'panjang_nomor' => 3,
            'status' => 'aktif',
            'urutan' => 1,
        ]);
    }

    public function test_laporan_page_cannot_be_accessed_by_guest(): void
    {
        $response = $this->get(route('laporan.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_laporan_page_can_be_rendered_for_authenticated_user(): void
    {
        Antrean::create([
            'tanggal' => Carbon::today()->toDateString(),
            'prefix' => 'A',
            'nomor' => 'A001',
            'nomor_urut' => 1,
            'loket_id' => $this->loket->id,
            'status' => 'selesai',
            'waktu_daftar' => Carbon::now()->subMinutes(20),
            'waktu_panggil' => Carbon::now()->subMinutes(15),
            'waktu_selesai' => Carbon::now()->subMinutes(5),
            'jumlah_panggilan' => 1,
            'petugas_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->get(route('laporan.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Laporan/Index')
            ->has('filters')
            ->has('lokets')
            ->has('stats')
            ->where('stats.total', 1)
            ->where('stats.selesai', 1)
        );
    }

    public function test_laporan_can_filter_by_date_and_loket(): void
    {
        $yesterday = Carbon::yesterday()->toDateString();
        $today = Carbon::today()->toDateString();

        Antrean::create([
            'tanggal' => $yesterday,
            'prefix' => 'A',
            'nomor' => 'A001',
            'nomor_urut' => 1,
            'loket_id' => $this->loket->id,
            'status' => 'selesai',
            'waktu_daftar' => Carbon::yesterday()->setHour(8),
            'waktu_panggil' => Carbon::yesterday()->setHour(8)->addMinutes(10),
            'waktu_selesai' => Carbon::yesterday()->setHour(8)->addMinutes(20),
            'jumlah_panggilan' => 1,
        ]);

        Antrean::create([
            'tanggal' => $today,
            'prefix' => 'A',
            'nomor' => 'A002',
            'nomor_urut' => 2,
            'loket_id' => $this->loket->id,
            'status' => 'terlewat',
            'waktu_daftar' => Carbon::now()->subMinutes(10),
            'waktu_panggil' => Carbon::now()->subMinutes(5),
            'jumlah_panggilan' => 2,
        ]);

        // Filter only today
        $response = $this->actingAs($this->user)->get(route('laporan.index', [
            'tanggal_mulai' => $today,
            'tanggal_selesai' => $today,
            'loket_id' => $this->loket->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 1)
            ->where('stats.terlewat', 1)
        );
    }

    public function test_laporan_can_export_csv(): void
    {
        Antrean::create([
            'tanggal' => Carbon::today()->toDateString(),
            'prefix' => 'A',
            'nomor' => 'A001',
            'nomor_urut' => 1,
            'nama_pasien' => 'SITI AMINAH',
            'no_rkm_medis' => '123456',
            'loket_id' => $this->loket->id,
            'status' => 'selesai',
            'waktu_daftar' => Carbon::now()->subMinutes(10),
            'waktu_panggil' => Carbon::now()->subMinutes(5),
            'waktu_selesai' => Carbon::now(),
            'jumlah_panggilan' => 1,
        ]);

        $response = $this->actingAs($this->user)->get(route('laporan.export', [
            'tanggal_mulai' => Carbon::today()->toDateString(),
            'tanggal_selesai' => Carbon::today()->toDateString(),
        ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_laporan_can_render_print_view(): void
    {
        $response = $this->actingAs($this->user)->get(route('laporan.cetak', [
            'tanggal_mulai' => Carbon::today()->toDateString(),
            'tanggal_selesai' => Carbon::today()->toDateString(),
        ]));

        $response->assertOk();
        $response->assertViewIs('laporan.cetak');
    }
}
