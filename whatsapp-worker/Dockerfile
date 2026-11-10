FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY src ./src
RUN mkdir -p /app/auth && chown -R node:node /app
USER node
ENV NODE_ENV=production
EXPOSE 3100
CMD ["npm", "start"]
