# Recorded model cache

L2 of the fallback ladder. Files are named `rank-<sha256>.json` and
`narration-<sha256>.json`, keyed by
`sha256(corpusHash + rubricVersion + modelId + request)`.

Per ruling R8, no real model output is committed here until the TypeSafe and Google
provider terms are read. The directory is empty in the public repo on purpose. In
development, `CACHE_RECORD=1` writes live responses here; the files contain no
headers, keys or prompts with secrets.
