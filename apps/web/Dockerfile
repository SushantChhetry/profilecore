FROM node:23-alpine

RUN corepack enable

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/profile-schema/package.json packages/profile-schema/package.json

RUN pnpm install --no-frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "--filter", "@profilecore/web", "dev", "--hostname", "0.0.0.0", "--port", "3000"]

