"""
Django settings for shopwiz project.

Generated by 'django-admin startproject' using Django 4.2.4.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

import json
from datetime import timedelta
from django.utils import timezone

from pathlib import Path
from dotenv import load_dotenv, find_dotenv

SITE_ID = 1
BASE_DIR = Path(__file__).resolve().parent.parent

# Load config
with open("/etc/shopwiz_config.json") as f:
    CONFIG = json.loads(f.read())

ENV = CONFIG["ENV"]

if ENV == "DEV":
    BASE_DOMAIN = "localhost"
    # CSRF_COOKIE_DOMAIN = f".{CONFIG["BASE_DOMAINNN"]}"
    DEBUG = True
    ALLOWED_HOSTS = ["*"]
    # CSRF
    CSRF_COOKIE_SECURE = False
    CSRF_COOKIE_DOMAIN = "localhost"
    CSRF_TRUSTED_ORIGINS = []
    # CORS
    CORS_ALLOW_ALL_ORIGINS = True
else:
    DEBUG = False

    BASE_DOMAIN = CONFIG["BASE_DOMAIN"]
    HOST = CONFIG["HOST"]
    ALLOWED_HOSTS = [HOST]
    # CSRF
    CSRF_COOKIE_SECURE = True
    # TODO: Change once fixed
    CSRF_COOKIE_DOMAIN = f".{BASE_DOMAIN}"
    CSRF_TRUSTED_ORIGINS = [f"https://{BASE_DOMAIN}"]
    # CORS
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [f"https://{BASE_DOMAIN}"]
    # Session
    SESSION_COOKIE_SECURE = True


# Other SCRF
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = True

# Other CORS
CORS_ALLOW_CREDENTIALS = True


SIGNING_KEY = CONFIG["SIGNING_KEY"]
SECRET_KEY = CONFIG["DJANGO_SALT_KEY"]
GOOGLE_CLIENT_ID = CONFIG["GOOGLE_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = CONFIG["GOOGLE_CLIENT_SECRET"]

# Application definition
INSTALLED_APPS = [
    "django_extensions",
    "corsheaders",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "django_celery_beat",
    "rest_framework",
    # Authentication
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    # Local Apps
    "shopwiz.apps.users",
    "shopwiz.apps.core",
]

APPEND_SLASH = True

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "config.urls"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "EXCEPTION_HANDLER": "rest_framework.views.exception_handler",
    # "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
}

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

if DEBUG:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": str(BASE_DIR / "db.sqlite3"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": CONFIG["DB_NAME"],
            "USER": CONFIG["DB_USER"],
            "PASSWORD": CONFIG["DB_PASS"],
            "HOST": CONFIG["DB_HOST"],
            "PORT": CONFIG["DB_PORT"],
        }
    }
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/
LANGUAGE_CODE = "en-us"

TIME_ZONE = "Europe/Dublin"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Testing email
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = "smtp.sendgrid.net"
    EMAIL_HOST_USER = "apikey"
    EMAIL_HOST_PASSWORD = CONFIG["SENDGRID_API_KEY"]
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    DEFAULT_FROM_EMAIL = "Shop Wiz <shopwiz@shop-wiz.ie>"

# CACHE
CACHES = {
    "default": {
        # "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://localhost:6379",
    }
}

# Scraping config
CACHE_SHOP_SCRAPE_EXECUTION_SECONDS = 50
ENABLED_SCRAPERS = ["TescoScraper", "AldiScraper", "SuperValuScraper"]
RESULTS_EXPIRY_DAYS = 10


# CELERY config
CELERY_BROKER_URL = "redis://localhost:6379"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"

CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

CELERY_BEAT_SCHEDULE = {
    "delete_unverified_emails_every_day": {
        "task": "shopwiz.apps.users.tasks.delete_unverified_emails",
        "schedule": timedelta(days=1),
    },
    "reset_password_request_counts_every_day": {
        "task": "shopwiz.apps.users.tasks.reset_password_request_counts",
        "schedule": timedelta(days=1),
    },
}

AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
)

# Enforce good password practices
ACCOUNT_ADAPTER = "shopwiz.apps.users.adapters.MyAccountAdapter"

# Use email for authentication instead of usernames.
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_SUBJECT_PREFIX = "\u200B"

# Optional: Use this if you want the user to confirm their email before they can login.
ACCOUNT_EMAIL_VERIFICATION = "mandatory"

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "SIGNING_KEY": SIGNING_KEY,
    "ALGORITHM": "HS512",
}

REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_HTTPONLY": False,
    "USER_DETAILS_SERIALIZER": "shopwiz.apps.users.serializers.CustomUserDetailsSerializer",
}

SOCIALACCOUNT_ADAPTER = "users.adapters.CustomSocialAccountAdapter"
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": GOOGLE_CLIENT_ID,
            "secret": GOOGLE_CLIENT_SECRET,
            "key": "",
        },
        "SCOPE": [
            "profile",
            "email",
        ],
        "AUTH_PARAMS": {
            "access_type": "offline",
        },
        "OAUTH_PKCE_ENABLED": True,
        "VERIFIED_EMAIL": True,
    },
}

# Security configs
EMAIL_RESEND_LIMIT = 3