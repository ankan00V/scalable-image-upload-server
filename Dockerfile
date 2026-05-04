FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Set a default port, can be overridden by docker-compose
ENV PORT=3000
EXPOSE $PORT

CMD ["npm", "start"]
