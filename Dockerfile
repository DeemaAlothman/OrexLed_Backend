# ---- build stage: installs all deps, generates Prisma client, compiles TypeScript ----
FROM node:22-alpine AS build
WORKDIR /app

# build tools needed to compile the native bcrypt addon on alpine (musl)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# drop devDependencies now that the build artifacts exist; bcrypt's already-compiled
# native binary is untouched since prune only removes package directories
RUN npm prune --omit=dev

# ---- runtime stage: no compilers, just the app ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3020

ENTRYPOINT ["./docker-entrypoint.sh"]
