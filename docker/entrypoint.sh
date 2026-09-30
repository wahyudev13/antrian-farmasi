#!/bin/sh
# =============================================================================
# entrypoint.sh — Antrean Farmasi Docker Startup Script
# =============================================================================
set -e

echo "=== Antrean Farmasi — Starting ==="

# ─── Pastikan storage & cache writable ───────────────────────────────────────
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ─── Buat direktori log supervisor ───────────────────────────────────────────
mkdir -p /var/log/supervisor

# ─── Tunggu database siap ────────────────────────────────────────────────────
echo "Waiting for database..."
MAX_RETRIES=30
RETRIES=0
until php artisan db:show --no-interaction > /dev/null 2>&1; do
    RETRIES=$((RETRIES+1))
    if [ $RETRIES -ge $MAX_RETRIES ]; then
        echo "ERROR: Database tidak bisa diakses setelah $MAX_RETRIES percobaan."
        exit 1
    fi
    echo "  Database belum siap, coba lagi dalam 2 detik... ($RETRIES/$MAX_RETRIES)"
    sleep 2
done
echo "Database siap!"

# ─── Laravel production optimization ─────────────────────────────────────────
echo "Running migrations..."
php artisan migrate --force --no-interaction

# ─── Pastikan direktori storage framework ada ─────────────────────────────────
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/app/public
chown -R www-data:www-data /var/www/html/storage
chmod -R 775 /var/www/html/storage

echo "Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:clear 2>/dev/null || true
php artisan view:cache 2>/dev/null || true
php artisan event:cache 2>/dev/null || true

echo "Storage link..."
php artisan storage:link --no-interaction 2>/dev/null || true

echo "=== Setup selesai, menjalankan services... ==="

# ─── Start Supervisor (manages nginx + php-fpm + queue + reverb) ─────────────
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
