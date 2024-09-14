#!/bin/sh

set -e

if [ -z ${DB_NAME} ]; then
  echo "SQLite will be used.";
else
  wait-for-it -s "$DB_HOST:$DB_PORT" -t 60
fi

gosu "$USER" python manage.py migrate --noinput

exec "$@"