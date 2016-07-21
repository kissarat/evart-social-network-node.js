#!/usr/bin/env bash

export LC_ALL=C
INSTALL=/tmp/vagrant-install

sudo locate-gen
mkdir $INSTALL
cd $INSTALL

if [ ! -f /usr/bin/mongo ]; then
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
    sudo echo "deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
fi
sudo apt-get update
sudo apt-get install mongodb-org build-essential git libmagic-dev -y

if [ ! -f /usr/local/bin/node ]; then
    wget https://nodejs.org/dist/v6.3.0/node-v6.3.0-linux-x64.tar.xz
    tar xvf node-v6.3.0-linux-x64.tar.xz
    cd node-v6.3.0-linux-x64
    sudo mv bin/* /usr/local/bin/
    sudo mv lib/* /usr/local/lib/
    sudo mv include/* /usr/local/include/
    cd /usr/local/lib/node_modules/npm
    ./configure
    sudo make install
    cd $INSTALL
fi

[ ! -f /usr/bin/nginx ] && sudo apt-get install nginx -y

if [ ! -f /usr/local/site/socex ]; then
    sudo mkdir /usr/local/site
    sudo ln -s /vagrant /usr/local/site/socex
    sudo cp /vagrant/server/nginx/config/debian.conf /etc/nginx/nginx.conf
    sudo service nginx restart
    cd /usr/local/site/socex
    ./deploy.sh
fi
