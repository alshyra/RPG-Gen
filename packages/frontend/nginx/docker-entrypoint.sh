#!/bin/sh
set -e

# Default backend URL if not provided
BACKEND_URL=${BACKEND_URL:-http://backend:3001}
DNS_RESOLVER=${DNS_RESOLVER:-8.8.8.8}
echo "Starting nginx with BACKEND_URL=${BACKEND_URL} and DNS_RESOLVER=${DNS_RESOLVER}"

# Substitute environment variables in nginx config template
# If DNS_RESOLVER is empty we remove the resolver-related lines before writing the final config
if [ -z "${DNS_RESOLVER}" ]; then
	echo "DNS_RESOLVER is not set — removing resolver lines from nginx config template"
	# Substitute only BACKEND_URL, then delete resolver lines
	envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template |
		sed -E '/^\s*resolver\s+/d; /^\s*resolver_timeout\s+/d' > /etc/nginx/conf.d/default.conf
else
	envsubst '${BACKEND_URL} ${DNS_RESOLVER}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
fi

# Verify the generated config
echo "Generated nginx config:"
cat /etc/nginx/conf.d/default.conf

# Test nginx configuration
nginx -t

# Start nginx
exec nginx -g 'daemon off;'
