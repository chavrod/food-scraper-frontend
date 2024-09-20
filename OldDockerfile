FROM python:3.12.6-slim-bookworm

ARG PROJECT_NAME=sw_core
ARG USER=django_user
ARG USER_UID=1001
ARG DJANGO_PORT=8000
ARG GUNICORN_WORKERS=2
# the value is in seconds
ARG GUNICORN_TIMEOUT=60
ARG GUNICORN_LOG_LEVEL=info
ARG DJANGO_BASE_DIR=/usr/src/$PROJECT_NAME
ARG DJANGO_MEDIA_ROOT=/var/www/media


ENV \
  USER=$USER \
  USER_UID=$USER_UID \
  PROJECT_NAME=$PROJECT_NAME \
  DJANGO_PORT=$DJANGO_PORT \
  GUNICORN_WORKERS=$GUNICORN_WORKERS \
  GUNICORN_TIMEOUT=$GUNICORN_TIMEOUT \
  GUNICORN_LOG_LEVEL=$GUNICORN_LOG_LEVEL \
  DJANGO_BASE_DIR=$DJANGO_BASE_DIR \
  DJANGO_MEDIA_ROOT=$DJANGO_MEDIA_ROOT


COPY docker-entrypoint.sh /
COPY docker-cmd.sh /
COPY runsocket.sh /
COPY websocket.py /


WORKDIR $DJANGO_BASE_DIR
COPY . $DJANGO_BASE_DIR

# Ensure scripts are executable
RUN chmod +x /docker-entrypoint.sh /docker-cmd.sh /runsocket.sh

# User
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  build-essential \
  gcc \ 
  g++ \
  libpq-dev \ 
  python3-dev \
  gosu \
  libffi-dev && \
  mkdir -p $DJANGO_MEDIA_ROOT && \
  adduser --shell /bin/sh --disabled-password -u $USER_UID $USER && \
  chown -R $USER:$USER $DJANGO_BASE_DIR $DJANGO_MEDIA_ROOT


# Install requirements
RUN pip install --no-cache-dir --prefix=/install -r ./requirements.txt


ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/docker-cmd.sh"]

EXPOSE $DJANGO_PORT
# Websocket port
EXPOSE 8888