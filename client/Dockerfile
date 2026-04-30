# Build context for this image is the repo root, so we can pull in ../shared.
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json ./client/
WORKDIR /app/client
RUN npm ci
WORKDIR /app
COPY shared ./shared
COPY client ./client
WORKDIR /app/client
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
