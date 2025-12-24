# ===========================
# Stage 1: Build UI
# ===========================
FROM node:20-alpine AS ui-builder

WORKDIR /app/ui

# Install pnpm
RUN npm install -g pnpm

# Copy UI package files
COPY ui/package.json ui/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy UI source
COPY ui/ ./

# Build UI
RUN pnpm run build

# ===========================
# Stage 2: Build Rust
# ===========================
FROM rust:1.90-bookworm AS rust-builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo files first for dependency caching
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates

# Copy UI dist from previous stage
COPY --from=ui-builder /app/ui/dist ./ui/dist

# Build release binary
RUN cargo build --release -p kellnr --bin crates

# ===========================
# Stage 3: Runtime
# ===========================
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install rustup and rust-src for rustdoc generation
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup component add rust-src

# Copy binary from builder
COPY --from=rust-builder /app/target/release/crates /app/crates

# Copy default config
COPY config/default.toml /app/config/default.toml

# Create data directory
RUN mkdir -p /data

# Default environment variables (can be overridden)
ENV KELLNR_REGISTRY__DATA_DIR=/data
ENV KELLNR_LOCAL__IP=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:${PORT:-8000}/api/v1/health || exit 1

EXPOSE 8000

CMD ["/app/crates"]

