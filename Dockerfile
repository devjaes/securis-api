FROM node:20-alpine AS base

RUN npm install -g pnpm
RUN npm install -g @nestjs/cli

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile


FROM base AS build

COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN pnpm run build
# RUN pnpm prune --prod

FROM base AS deploy

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main"]
