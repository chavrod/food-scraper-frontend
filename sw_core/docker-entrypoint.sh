#!/bin/sh

set -e

# Print the PATH to debug
echo "Current PATH: $PATH"

# Verify wait-for-it is installed by searching for it
echo "Searching for wait-for-it..."
if ! find / -name wait-for-it 2>/dev/null; then
  echo "wait-for-it not found anywhere on the system."
else
  echo "wait-for-it found:"
  find / -name wait-for-it 2>/dev/null
fi

if [ -z ${DB_NAME} ]; then
  echo "SQLite will be used.";
else
  wait-for-it -s "$DB_HOST:$DB_PORT" -t 60
fi

gosu "$USER" python manage.py migrate --noinput

exec "$@"