#!/bin/sh
# vim:sw=4:ts=4:et

gosu "$USER" python manage.py collectstatic --noinput

if [ "$1" = "--debug" ]; then
  # Django development server
  exec gosu "$USER" python manage.py runserver "0.0.0.0:$DJANGO_DEV_SERVER_PORT & /runsocket.sh"
else
  # Gunicorn
  exec gosu "$USER" gunicorn "$PROJECT_NAME.wsgi:application" \
    --bind "0.0.0.0:$GUNICORN_PORT" \
    --workers "$GUNICORN_WORKERS" \
    --timeout "$GUNICORN_TIMEOUT" \
    --log-level "$GUNICORN_LOG_LEVEL & /runsocket.sh"
fi