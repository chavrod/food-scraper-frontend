#!/bin/sh

if [ "$1" = "--debug" ]; then
  # Django development server
  exec gosu "$USER" python manage.py runserver "0.0.0.0:$DJANGO_PORT & /runsocket.sh"
else
  # Gunicorn
  exec gosu "$USER" gunicorn "$PROJECT_NAME.wsgi:application" \
    --bind "0.0.0.0:$DJANGO_PORT" \
    --workers "$GUNICORN_WORKERS" \
    --timeout "$GUNICORN_TIMEOUT" \
    --log-level "$GUNICORN_LOG_LEVEL & /runsocket.sh"
fi