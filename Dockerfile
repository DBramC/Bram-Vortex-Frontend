# --- Stage 1: Build React App ---
FROM node:20-alpine as builder
LABEL authors="dabram"
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine
# Αντιγράφουμε το build folder στον φάκελο του Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Αντιγράφουμε το config μας
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
