# Stage 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build && ls -la /app/dist

# Stage 2: Serve with nginx
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/* /etc/nginx/http.d/*
COPY --from=build /app/dist/. /usr/share/nginx/html/
RUN chmod -R 755 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/http.d/default.conf
EXPOSE 80 5173
CMD ["nginx", "-g", "daemon off;"]

