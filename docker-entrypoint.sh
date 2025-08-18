#!/bin/bash

# Copy .env if not already present
[ -f .env ] || cp .env.example .env

# Create SQLite file if it doesn't exist
if [ "$DB_CONNECTION" = "sqlite" ]; then
    DB_PATH=${DB_DATABASE:-"/app/database/database.sqlite"}
    if [ ! -f "$DB_PATH" ]; then
        echo "Creating SQLite file at $DB_PATH"
        mkdir -p "$(dirname "$DB_PATH")"
        touch "$DB_PATH"
    fi
fi

# Generate app key if not present
php artisan key:generate --force
php artisan migrate --force

# Laravel setup
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start queue in background
php artisan queue:work --daemon &

[ -f storage/app/private/shops.json ] && chmod 600 storage/app/private/shops.json

# Start server
php -S 0.0.0.0:8080 -t public
