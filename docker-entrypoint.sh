#!/bin/bash

# Copy .env if not already present
[ -f .env ] || cp .env.example .env

# Generate app key if not present
php artisan key:generate --force

# Laravel setup
php artisan config:cache
php artisan route:cache
php artisan view:cache
# php artisan migrate --force

# Start queue in background
php artisan queue:work --daemon &

[ -f storage/app/private/shops.json ] && chmod 600 storage/app/private/shops.json

# Start server
php -S 0.0.0.0:8000 -t public
