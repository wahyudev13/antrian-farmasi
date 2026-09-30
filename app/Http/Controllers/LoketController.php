<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoketRequest;
use App\Models\Loket;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LoketController extends Controller
{
    /**
     * Display a listing of lokets.
     */
    public function index(): Response
    {
        $lokets = Loket::orderBy('urutan', 'asc')->orderBy('id', 'asc')->get();

        return Inertia::render('Loket/Index', [
            'lokets' => $lokets,
        ]);
    }

    /**
     * Store a newly created loket.
     */
    public function store(LoketRequest $request): RedirectResponse
    {
        Loket::create($request->validated());

        return redirect()->route('loket.index')->with('success', 'Loket baru berhasil ditambahkan.');
    }

    /**
     * Update the specified loket.
     */
    public function update(LoketRequest $request, Loket $loket): RedirectResponse
    {
        $loket->update($request->validated());

        return redirect()->route('loket.index')->with('success', 'Data loket berhasil diperbarui.');
    }

    /**
     * Toggle active status of a loket.
     */
    public function toggleStatus(Loket $loket): RedirectResponse
    {
        $newStatus = $loket->status === 'aktif' ? 'nonaktif' : 'aktif';
        $loket->update(['status' => $newStatus]);

        return redirect()->route('loket.index')->with(
            'success',
            "Status {$loket->nama} berhasil diubah menjadi ".strtoupper($newStatus).'.'
        );
    }

    /**
     * Remove the specified loket.
     */
    public function destroy(Loket $loket): RedirectResponse
    {
        $hasAntrean = $loket->antreans()->whereIn('status', ['menunggu', 'dipanggil', 'dilayani'])->exists();
        if ($hasAntrean) {
            return redirect()->route('loket.index')->with(
                'error',
                'Tidak dapat menghapus loket yang masih memiliki antrean aktif.'
            );
        }

        $loket->delete();

        return redirect()->route('loket.index')->with('success', 'Loket berhasil dihapus.');
    }
}
