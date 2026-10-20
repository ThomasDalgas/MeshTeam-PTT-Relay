FROM node:22-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --chown=node:node src ./src
COPY --chown=node:node ha ./ha
COPY entrypoint.sh /usr/local/bin/meshteam-entrypoint
RUN chmod 755 /usr/local/bin/meshteam-entrypoint
ENV HOST=0.0.0.0 PORT=8788 RELAY_CONFIG=/data/relay.json HA_OPTIONS=/data/options.json HA_ADMIN_PORT=8099
EXPOSE 8788 8099 8443
ENTRYPOINT ["/usr/local/bin/meshteam-entrypoint"]
CMD ["node", "ha/main.mjs"]
