#!/bin/bash
# Fixes the 413 Payload Too Large error on the remote Hetzner server
# It copies the updated rurubene.nginx.conf and php_optimization.ini to the server,
# and restarts Nginx and PHP-FPM.

SERVER="91.99.89.94"
USER="root"
PASS="!m3n@!k@!"

echo "=== Uploading updated Nginx Configuration ==="
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no ./rurubene.nginx.conf ${USER}@${SERVER}:/etc/nginx/sites-available/rurubene

echo "=== Uploading PHP Optimization Configuration ==="
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no ./php_optimization.ini ${USER}@${SERVER}:/etc/php/8.3/fpm/conf.d/99-optimization.ini
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no ./php_optimization.ini ${USER}@${SERVER}:/etc/php/8.5/fpm/conf.d/99-optimization.ini

echo "=== Reloading Nginx and PHP-FPM Services ==="
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no ${USER}@${SERVER} "nginx -t && systemctl reload nginx && systemctl restart php8.3-fpm php8.5-fpm 2>/dev/null || true"

echo "=== Done! The 413 error should now be resolved. ==="
