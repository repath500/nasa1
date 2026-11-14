#!/bin/sh
# SPEC §16: fail if anything key-like is in build output, public assets or git history.
PAT='AIza[0-9A-Za-z_-]{20,}|sk_(live|test)_[0-9A-Za-z]{10,}|whsec_[0-9A-Za-z]{10,}|xi-api-key: *[0-9a-f]{20,}|Bearer [A-Za-z0-9._-]{30,}'
FOUND=0
for d in apps/web/dist apps/web/public packages; do [ -d "$d" ] && grep -rEn --exclude-dir=node_modules "$PAT" "$d" && FOUND=1; done
HITS=$(git log -p --all | grep -En "$PAT" | head -5); [ -n "$HITS" ] && { echo "$HITS"; FOUND=1; }
[ $FOUND -eq 0 ] && echo "secret-scan clean" || { echo "secret-scan FOUND matches"; exit 1; }
