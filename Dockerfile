FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git curl zip unzip mariadb-client \
    libpng-dev libonig-dev libxml2-dev libzip-dev \
    nginx supervisor cron

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy app files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chmod -R 775 storage bootstrap/cache && chown -R www-data:www-data .

# Expose port
EXPOSE 8000

# Start Laravel app (runtime stage)
CMD php artisan key:generate && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000