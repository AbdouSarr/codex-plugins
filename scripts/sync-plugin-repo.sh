#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo "Usage: $0 <plugin-name> <owner/repo> [branch]" >&2
  exit 2
fi

plugin_name="$1"
repo="$2"
branch="${3:-main}"
prefix="plugins/${plugin_name}"

if [ ! -d "$prefix" ]; then
  echo "Missing plugin directory: $prefix" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree has uncommitted changes. Commit before syncing an individual plugin repo." >&2
  exit 1
fi

split_sha="$(git subtree split --prefix="$prefix" HEAD)"
git push "https://github.com/${repo}.git" "${split_sha}:refs/heads/${branch}"
