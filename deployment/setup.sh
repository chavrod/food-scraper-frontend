# Point core.shopwiz.ie to server IP
# Point admin.shopwiz.ie to server IP
# Point shopwiz.ie to server IP

# Copy over secrets

# SSH into server
ssh root@core.shopwiz.ie

# Disable password login

# Create non root user
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get -y upgrade
adduser sw
adduser sw sudo
cp -r .ssh /home/sw/
chown sw /home/sw/.ssh
chown sw /home/sw/.ssh/*
chmod 700 /home/sw/.ssh
chmod 600 /home/sw/.ssh/*

# Configure firewall
ufw default allow outgoing
ufw default deny incoming
ufw allow ssh
ufw allow http/tcp
ufw allow https
ufw enable
ufw status

reboot now

# Log in as non root user and setup environment
ssh sw@core.shopwiz.ie

# Gen ssh key and add to gitlab account
ssh-keygen
cat .ssh/id_rsa.pub

# Add ssh key to gitlab: https://gitlab.com/-/profile/keys

git clone git@gitlab.com:[ACC].git src
cd src
git status
git checkout [BRANCH]

mkdir /home/sw/src/sw_core/venv

sudo apt-get -y install python3-venv
python3 -m venv /home/sw/src/sw_core/venv

source /home/sw/src/sw_core/venv/bin/activate
sudo apt-get -y install libpq-dev python3-dev build-essential
pip install -r /home/sw/src/sw_core/requirements.txt

# Install Redis
sudo apt install -y redis-server
sudo vim /etc/redis/redis.conf # set `supervised` to `systemd`
sudo systemctl restart redis.service

# Make sure ENV=PRODUCTION in config
sudo vim /etc/shopwiz_config.json

python manage.py makemigrations
python manage.py migrate
# python manage.py createdefaultusers
# python manage.py create_default_accounts
# python manage.py create_default_settings
# python manage.py send_test_email
# python manage.py send_example_emails --email dchavro@gmail.com

# create other test scripts....