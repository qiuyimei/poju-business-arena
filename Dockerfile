FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node server ./server
COPY --chown=node:node lib ./lib
COPY --chown=node:node drizzle ./drizzle
COPY --chown=node:node public ./public
RUN mkdir /data && chown node:node /data
USER node
ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0 DATA_DIR=/data
EXPOSE 8080
CMD ["node", "server.mjs"]
