#!/bin/sh
# vim:sw=4:ts=4:et

set -e

if [ -z ${DB_NAME} ]; then
  echo "SQLite will be used.";
else
  wait-for-it -s "$DB_HOST:$DB_PORT" -t 60
fi
# You can comment out this line if you want to migrate manually
gosu "$USER" python manage.py migrate --noinput

exec "$@"