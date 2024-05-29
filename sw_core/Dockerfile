FROM python:3.10-slim-bullseye as base

FROM base as builder

# RUN apt-get update && apt-get --no-cache add python3-dev libpq-dev && mkdir /install
# Update package list and install dependencies
RUN apt-get update && \
  apt-get install -y --no-install-recommends python3-dev libpq-dev
# Clean up package list to reduce image size
RUN rm -rf /var/lib/apt/lists/*
# Create the /install directory
RUN mkdir /install
WORKDIR /install
COPY requirements.txt ./
RUN pip install --no-cache-dir --prefix=/install -r ./requirements.txt

FROM base

ARG USER=django_user
ARG USER_UID=1001
ARG PROJECT_NAME=sw_core
ARG GUNICORN_PORT=8000
ARG GUNICORN_WORKERS=2
# the value is in seconds
ARG GUNICORN_TIMEOUT=60
ARG GUNICORN_LOG_LEVEL=info
ARG DJANGO_BASE_DIR=/usr/src/$PROJECT_NAME
ARG DJANGO_STATIC_ROOT=/var/www/static
ARG DJANGO_MEDIA_ROOT=/var/www/media
ARG DJANGO_SQLITE_DIR=/sqlite

ARG DJANGO_DEV_SERVER_PORT=8000


ENV \
  USER=$USER \
  USER_UID=$USER_UID \
  PROJECT_NAME=$PROJECT_NAME \
  GUNICORN_PORT=$GUNICORN_PORT \
  GUNICORN_WORKERS=$GUNICORN_WORKERS \
  GUNICORN_TIMEOUT=$GUNICORN_TIMEOUT \
  GUNICORN_LOG_LEVEL=$GUNICORN_LOG_LEVEL \
  DJANGO_BASE_DIR=$DJANGO_BASE_DIR \
  DJANGO_STATIC_ROOT=$DJANGO_STATIC_ROOT \
  DJANGO_MEDIA_ROOT=$DJANGO_MEDIA_ROOT \
  DJANGO_SQLITE_DIR=$DJANGO_SQLITE_DIR \
  DJANGO_DEV_SERVER_PORT=$DJANGO_DEV_SERVER_PORT


COPY --from=builder /install /usr/local
COPY docker-entrypoint.sh /
COPY docker-cmd.sh /

COPY runsocket.sh /
COPY websocket.py /

# COPY $PROJECT_NAME $DJANGO_BASE_DIR
COPY . $DJANGO_BASE_DIR

# Ensure scripts are executable
RUN chmod +x /docker-entrypoint.sh /docker-cmd.sh /runsocket.sh

# User
RUN apt-get update && \
  apt-get install -y --no-install-recommends libpq-dev gosu && \
  mkdir -p $DJANGO_STATIC_ROOT $DJANGO_MEDIA_ROOT $DJANGO_SQLITE_DIR && \
  adduser --shell /bin/sh --disabled-password -u $USER_UID $USER && \
  chown -R $USER:$USER $DJANGO_BASE_DIR $DJANGO_STATIC_ROOT $DJANGO_MEDIA_ROOT $DJANGO_SQLITE_DIR

WORKDIR $DJANGO_BASE_DIR
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/docker-cmd.sh"]

EXPOSE $GUNICORN_PORT
EXPOSE 8888