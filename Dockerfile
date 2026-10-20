FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && mkdir /app/data && chown node:node /app/data
COPY --chown=node:node src ./src
USER node
ENV HOST=0.0.0.0 PORT=8788 RELAY_CONFIG=/app/data/relay.json
EXPOSE 8788
CMD ["node", "src/main.mjs"]
