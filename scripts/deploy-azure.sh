#!/bin/bash
# Despliega en la VM de Azure los commits locales que la VM todavía no tiene,
# SIN pasar por GitHub (se copia un git bundle por scp). Ver la nota del vault
# U/2-2026/SI2/Parcial1/App/Despliegue_Azure.md.
#
# Uso:  bash scripts/deploy-azure.sh
# - Lee en qué commit está la VM y manda solo lo que falta.
# - Se frena si la VM tiene cambios sin commitear.
# - Etiqueta las imágenes actuales como :respaldo-<fecha-hora> antes de reconstruir.
set -euo pipefail
KEY=~/claves/SI2Proyecto_key.pem
VM=Leonardo@68.211.88.211
cd "$(dirname "$0")/.."

BASE=$(ssh -i "$KEY" "$VM" 'cd ~/projects/MirrorIA && git rev-parse HEAD')
git cat-file -e "$BASE" 2>/dev/null || { echo "El commit de la VM ($BASE) no existe acá"; exit 1; }
if [ "$BASE" = "$(git rev-parse HEAD)" ]; then echo "La VM ya está al día"; exit 0; fi
git bundle create /tmp/mirroria.bundle "$BASE"..HEAD
scp -i "$KEY" /tmp/mirroria.bundle "$VM":/tmp/mirroria.bundle

TAG=respaldo-$(date +%Y%m%d-%H%M)
ssh -i "$KEY" "$VM" "set -e
cd ~/projects/MirrorIA
test -z \"\$(git status --porcelain)\" || { echo 'La VM tiene cambios sin commitear, freno'; exit 1; }
docker tag mirroria-mirroria-backend  mirroria-mirroria-backend:$TAG
docker tag mirroria-mirroria-frontend mirroria-mirroria-frontend:$TAG
git fetch -q /tmp/mirroria.bundle HEAD
git merge --ff-only FETCH_HEAD
git log --oneline -1
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build mirroria-backend mirroria-frontend
sleep 15
docker ps --format '{{.Names}} {{.Status}}'
curl -s -o /dev/null -w 'health %{http_code}\n' http://localhost:3000/api/v1/health || true"
echo "Respaldo de imágenes: :$TAG"
