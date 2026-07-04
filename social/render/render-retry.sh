#!/bin/bash
# Render endurecido: valida tamanho (404 ≈ 47KB; arte real > 300KB) e tenta até 3x por slide.
# Uso: bash render-retry.sh   (server estático em http://127.0.0.1:4399)
cd "$(dirname "$0")" || exit 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
MIN=${MIN:-300000}
ids=(
  single-1-lancamento single-2-manifesto single-3-stat single-4-frase single-5-cultura single-6-cta
  carrosselA-0-capa carrosselA-1 carrosselA-2 carrosselA-3 carrosselA-4 carrosselA-5 carrosselA-6-cta
  carrosselB-0-capa carrosselB-1-dev carrosselB-2-ia carrosselB-3-cloud carrosselB-4-dados
  carrosselB-5-cyber carrosselB-6-consultoria carrosselB-7-cta
)
mkdir -p out
fail=0
for i in "${!ids[@]}"; do
  id="${ids[$i]}"; out="out/${id}.png"
  if [ -s "$out" ] && [ "$(stat -f%z "$out")" -gt "$MIN" ]; then echo "[$((i+1))/21] pulado (ok) $id"; continue; fi
  ok=0
  for attempt in 1 2 3; do
    rm -f "$out"; prof=$(mktemp -d)
    "$CHROME" --headless=new --disable-gpu --no-sandbox --no-first-run --hide-scrollbars \
      --force-device-scale-factor="${SCALE:-2}" --window-size=1080,1350 --virtual-time-budget=3500 \
      --user-data-dir="$prof" --screenshot="$out" "http://127.0.0.1:4399/render.html?i=$i" >/dev/null 2>&1 &
    pid=$!
    for w in $(seq 1 70); do [ -s "$out" ] && { sleep 0.9; break; }; sleep 0.2; done
    kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; rm -rf "$prof"
    sz=$(stat -f%z "$out" 2>/dev/null || echo 0)
    if [ "$sz" -gt "$MIN" ]; then ok=1; echo "[$((i+1))/21] OK ($sz bytes, tent.$attempt) $id"; break; fi
    echo "[$((i+1))/21] retry $attempt ($sz bytes) $id"
    sleep 1
  done
  [ "$ok" = 0 ] && { echo "[$((i+1))/21] FALHOU $id"; fail=1; }
done
echo "=== fim, fail=$fail ==="
exit $fail
