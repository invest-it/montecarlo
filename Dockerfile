# Stage 1: Build Rust → WASM
FROM rust:1 AS wasm-builder

RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY crates/ crates/

RUN wasm-pack build crates/core --target web --out-dir /wasm-out

# Stage 2: Build frontend (Vite)
FROM oven/bun:1 AS frontend-builder

WORKDIR /app
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile

COPY web/ ./
COPY --from=wasm-builder /wasm-out src/wasm/

RUN bun run build

# Stage 3: Production
FROM oven/bun:1-slim AS production

WORKDIR /app
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile --production

COPY web/src src/
COPY web/tsconfig.json tsconfig.json
COPY --from=frontend-builder /app/dist dist/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "src/index.ts"]
