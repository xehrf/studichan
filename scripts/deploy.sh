#!/usr/bin/env bash
# Обновление сайта на сервере hoster.kz одной командой:
#   npm run deploy
# Собирает фронтенд локально, копирует код на сервер, ставит зависимости,
# загружает каталог в базу и перезапускает сервис. .env на сервере не трогается.
set -euo pipefail

cd "$(dirname "$0")/.."
# Адрес сервера хранится в .deploy.env (не попадает в git, репозиторий публичный):
#   DEPLOY_HOST=root@IP_СЕРВЕРА
[ -f .deploy.env ] && . ./.deploy.env
HOST="${DEPLOY_HOST:?Укажите DEPLOY_HOST в .deploy.env, например DEPLOY_HOST=root@1.2.3.4}"
APP_DIR=/opt/studichan/app

NODE_ENV=production npx vite build

rsync -az --delete \
  --exclude node_modules --exclude .env --exclude .git --exclude .venv --exclude __pycache__ \
  --exclude .runtime --exclude design --exclude .claude --exclude 'data/review' --exclude '*.pyc' --exclude .deploy.env \
  ./ "$HOST:$APP_DIR/"

ssh "$HOST" "set -e
  chown -R studichan:studichan $APP_DIR
  cd $APP_DIR
  sudo -u studichan HOME=/opt/studichan npm ci --omit=dev --no-audit --no-fund >/dev/null
  sudo -u studichan HOME=/opt/studichan node scripts/seed.mjs
  systemctl restart studichan
  sleep 2
  curl -fsS 127.0.0.1:3000/api/health && echo"

echo "Готово: http://${HOST#*@}/"
