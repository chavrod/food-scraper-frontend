import mysql.connector

data_base = mysql.connector.connect(
    host = 'localhost',
    user = 'root',
    passwd = 'localpass123',
)

# prepear a cursor object
cursor_object = data_base.cursor()

# create a database
cursor_object.execute('CREATE DATABASE shop_wiz')

print('All Done!')