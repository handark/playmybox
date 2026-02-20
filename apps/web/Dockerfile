FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

# ─── Install dependencies ───
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter=web...

# ─── Build ───
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/ ./
COPY apps/web/ ./apps/web/

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter=web build

# ─── Production ───
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
