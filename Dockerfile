# =============================================================================
# Antrean Farmasi — Docker Image
# Build: docker build --build-arg REVERB_HOST=IP_SERVER -t antrian-farmasi .
# =============================================================================
FROM php:8.3-fpm-alpine

LABEL maintainer="RS PKU Sekapuk"
LABEL description="Antrean Farmasi"

# ─── Build Arguments (untuk Vite — diset saat build image) ───────────────────
# Nilai ini akan di-embed ke dalam JS bundle, bukan ke dalam .env
ARG REVERB_HOST=127.0.0.1
ARG REVERB_PORT=8080
ARG REVERB_SCHEME=http
ARG REVERB_APP_KEY=gfjrzhqj3agfxyhxy2rs
ARG APP_URL=http://localhost:8088

# Ekspor sebagai ENV agar Vite bisa baca saat build
ENV VITE_REVERB_HOST=${REVERB_HOST}
ENV VITE_REVERB_PORT=${REVERB_PORT}
ENV VITE_REVERB_SCHEME=${REVERB_SCHEME}
ENV VITE_REVERB_APP_KEY=${REVERB_APP_KEY}
ENV VITE_APP_NAME="Antrean Farmasi"

# -----------------------------------------------------------------------------
# System dependencies
# -----------------------------------------------------------------------------
RUN apk add --no-cache \
    nginx \
    supervisor \
    nodejs \
    npm \
    curl \
    git \
    zip \
    unzip \
    libpng-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    libxml2-dev \
    mysql-client \
    linux-headers

# -----------------------------------------------------------------------------
# PHP extensions
# -----------------------------------------------------------------------------
RUN docker-php-ext-install \
    pdo_mysql \
    mysqli \
    mbstring \
    gd \
    zip \
    bcmath \
    intl \
    pcntl \
    sockets \
    xml

RUN docker-php-ext-enable opcache

# -----------------------------------------------------------------------------
# Composer
# -----------------------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# -----------------------------------------------------------------------------
# PHP production config
# -----------------------------------------------------------------------------
COPY docker/php/php-production.ini /usr/local/etc/php/conf.d/php-production.ini
COPY docker/php/php-fpm-pool.conf /usr/local/etc/php-fpm.d/zz-production.conf

# -----------------------------------------------------------------------------
# App files (tanpa .env — lihat .dockerignore)
# -----------------------------------------------------------------------------
WORKDIR /var/www/html

# Install PHP deps dulu (layer caching)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Install JS deps & build Vite (pakai ARG di atas)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Salin semua kode
COPY . .

# Build frontend dengan VITE_* vars dari ARG
RUN npm run build && rm -rf node_modules

# Jalankan post-install scripts composer
RUN composer run-script post-autoload-dump --no-interaction 2>/dev/null || true

# -----------------------------------------------------------------------------
# Permissions
# -----------------------------------------------------------------------------
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && mkdir -p /var/log/php /var/log/supervisor

# -----------------------------------------------------------------------------
# Config files
# -----------------------------------------------------------------------------
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# -----------------------------------------------------------------------------
EXPOSE 80 8080

ENTRYPOINT ["/entrypoint.sh"]
