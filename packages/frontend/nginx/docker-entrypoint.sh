#!/bin/sh
set -e

# Default backend URL if not provided
BACKEND_URL=${BACKEND_URL:-http://backend:3001}
DNS_RESOLVER=${DNS_RESOLVER:-8.8.8.8}
echo "Starting nginx with BACKEND_URL=${BACKEND_URL} and DNS_RESOLVER=${DNS_RESOLVER}"

# Substitute environment variables in nginx config template
envsubst '${BACKEND_URL} ${DNS_RESOLVER}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Verify the generated config
echo "Generated nginx config:"
cat /etc/nginx/conf.d/default.conf

# Test nginx configuration
nginx -t

# Start nginx
exec nginx -g 'daemon off;'
