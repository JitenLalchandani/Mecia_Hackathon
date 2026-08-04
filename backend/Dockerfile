FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --production

# Copy source
COPY src/ ./src/
COPY ../ai/ ../ai/

EXPOSE 5000

CMD ["node", "src/server.js"]
