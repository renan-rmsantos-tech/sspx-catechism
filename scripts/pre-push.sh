#!/usr/bin/env bash
# Local feedback for the design-fidelity gate. The Dockerfile remains the
# authoritative deploy gate because it runs the same Vitest suite on production.
set -euo pipefail

repo_dir=$(git rev-parse --show-toplevel)
cd "$repo_dir/frontend"
npm test
