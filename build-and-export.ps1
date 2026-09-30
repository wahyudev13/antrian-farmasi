# =============================================================================
# build-and-export.ps1
# Script PowerShell untuk build Docker image dan export ke file .tar
#
# Cara pakai:
#   .\build-and-export.ps1 -ServerIP 192.168.1.100
# =============================================================================

param(
    [string]$ServerIP = "192.168.1.6",

    [string]$ReverbPort = "8080",
    [string]$ReverbScheme = "http",
    [string]$ReverbAppKey = "gfjrzhqj3agfxyhxy2rs",
    [string]$AppPort = "8088",
    [string]$ImageTag = "latest",
    [string]$OutputFile = "antrian-farmasi.tar"
)

$AppUrl = "${ReverbScheme}://${ServerIP}:${AppPort}"
$ImageName = "antrian-farmasi:${ImageTag}"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Antrean Farmasi - Build & Export Docker Image" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server IP   : $ServerIP" -ForegroundColor Yellow
Write-Host "App URL     : $AppUrl" -ForegroundColor Yellow
Write-Host "Reverb Host : ${ServerIP}:${ReverbPort}" -ForegroundColor Yellow
Write-Host "Image       : $ImageName" -ForegroundColor Yellow
Write-Host "Output      : $OutputFile" -ForegroundColor Yellow
Write-Host ""

# ─── Cek Docker running ───────────────────────────────────────────────────────
Write-Host "[1/3] Mengecek Docker..." -ForegroundColor Green
docker version > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker tidak berjalan. Jalankan Docker Desktop terlebih dahulu." -ForegroundColor Red
    exit 1
}
Write-Host "      Docker OK" -ForegroundColor Gray

# ─── Build image ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/3] Building Docker image (ini akan memakan waktu beberapa menit)..." -ForegroundColor Green

docker build `
    --build-arg REVERB_HOST=$ServerIP `
    --build-arg REVERB_PORT=$ReverbPort `
    --build-arg REVERB_SCHEME=$ReverbScheme `
    --build-arg REVERB_APP_KEY=$ReverbAppKey `
    --build-arg APP_URL=$AppUrl `
    -t $ImageName `
    .

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build gagal. Periksa output di atas." -ForegroundColor Red
    exit 1
}
Write-Host "      Build selesai!" -ForegroundColor Gray

# ─── Export ke .tar ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] Mengexport image ke $OutputFile..." -ForegroundColor Green

docker save -o $OutputFile $ImageName

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Export gagal." -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $OutputFile).Length / 1MB
Write-Host "      Export selesai! Ukuran file: $([math]::Round($fileSize, 1)) MB" -ForegroundColor Gray

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SELESAI!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "File yang perlu diupload ke server aaPanel:" -ForegroundColor Yellow
Write-Host "  1. $OutputFile              (image Docker)" -ForegroundColor White
Write-Host "  2. docker-compose.server.yml (konfigurasi container)" -ForegroundColor White
Write-Host "  3. .env.production           (rename jadi .env di server)" -ForegroundColor White
Write-Host ""
Write-Host "Di server aaPanel, jalankan:" -ForegroundColor Yellow
Write-Host "  docker load -i $OutputFile" -ForegroundColor Cyan
Write-Host "  docker compose -f docker-compose.server.yml up -d" -ForegroundColor Cyan
Write-Host ""
