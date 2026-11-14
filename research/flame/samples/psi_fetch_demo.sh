#!/usr/bin/env bash
# Reproduces the working PSI download route (verified Sat 14 Nov 2026, ~06:10 GMT, anonymous, no key).
# Usage: ./psi_fetch_demo.sh PSI-102 "PSI-102_Experimental table_SAME.csv" out.csv
# Step 1: ask the PSI web service for a presigned S3 URL (plain-text body, ~1 KB). `redirect=false` is required.
# Step 2: GET that URL (expires; never store or link it - fetch at build time only).
# NOTE: do NOT pass `version=` unless the file listing says so; for some legacy files it causes a wrong key (404).
set -euo pipefail
ACC="${1:?accession e.g. PSI-102}"; FILE="${2:?exact file_name from the investigation JSON}"; OUT="${3:?output path}"
Q=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.urlencode({"file":sys.argv[1],"redirect":"false"},quote_via=urllib.parse.quote))' "$FILE")
URL=$(curl -fsS -m 30 "https://psi.nasa.gov/geode-py/ws/studies/${ACC}/download?${Q}")
curl -fsS -m 120 -o "$OUT" "$URL"
echo "ok $(wc -c <"$OUT") bytes -> $OUT  sha256=$(shasum -a 256 "$OUT" | cut -c1-16)"
