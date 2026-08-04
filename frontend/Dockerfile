FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install
COPY src/ ./src/
COPY public/ ./public/

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
