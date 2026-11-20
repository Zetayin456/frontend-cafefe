FROM debian:stable

RUN apt-get update && apt-get install -y --no-install-recommends nginx && rm -rf /var/lib/apt/lists/*

COPY docker/nginx/default.conf /etc/nginx/sites-available/default
COPY src/ /var/www/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
