# --- Stage 1: Build React App ---
# ΑΛΛΑΓΗ 1: Χρησιμοποιούμε 'node:20-slim' (Debian-based) αντί για Alpine.
# Το Alpine έχει γνωστά θέματα με DNS timeouts σε μερικά δίκτυα.
FROM node:20-slim AS builder
LABEL authors="dabram"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
# ΑΛΛΑΓΗ 2: Χρησιμοποιούμε 'nginx:stable-bullseye' (Debian-based).
# Αυτό λύνει το "dial tcp i/o timeout" που βγάζει το nginx:alpine.
FROM nginx:stable-bullseye

# Αντιγράφουμε το build folder στον φάκελο του Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Αντιγράφουμε το config μας
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]