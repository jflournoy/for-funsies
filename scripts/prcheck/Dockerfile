# Base image for contained PR checks. Dependencies are installed from MAIN's
# lockfile and baked in, so the per-PR runs need no network at all.
#
# --ignore-scripts: never run lifecycle hooks from a dependency tree.
FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends python3-yaml \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
