# --- build stage (deps ayrı katmanda) ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# --- runtime stage ---
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# güvenlik: non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# sadece runtime dosyalarını kopyala
COPY --chown=app:app --from=deps /app/node_modules ./node_modules
COPY --chown=app:app index.js ./index.js

# healthcheck (isteğe bağlı)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

EXPOSE 3000
# .env’yi dışarıdan vereceğiz
CMD ["node", "index.js"]
