# WhaleGames Docker Image
# Simple nginx-based static file server

FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy application files
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY js /usr/share/nginx/html/js
COPY contracts /usr/share/nginx/html/contracts

# Expose ports 80 and 8080 (for DigitalOcean App Platform)
EXPOSE 80 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

