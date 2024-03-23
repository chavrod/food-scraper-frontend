rm db.sqlite3
rm core/migrations/0*.py
rm authentication/migrations/0*.py
python manage.py makemigrations
python manage.py migrate
echo "DONE"
