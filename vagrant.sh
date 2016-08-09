#!/usr/bin/env bash

if [ ! $LC_ALL ]; then
    export LC_ALL=C
    sudo /usr/sbin/locale-gen
fi

INSTALL=/tmp/vagrant-install
mkdir $INSTALL
cd $INSTALL

if [ ! -f /usr/bin/mongo ]; then
    sudo sed -i 's/httpredir.debian.org/debian.volia.net/g' /etc/apt/sources.list
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
    sudo echo "deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
    wget http://download.virtualbox.org/virtualbox/5.0.16/VBoxGuestAdditions_5.0.16.iso
    sudo apt-get update
    sudo apt-get install nginx mongodb-org build-essential git libmagic-dev linux-headers-`uname -r` -y
    sudo mount VBoxGuestAdditions_5.0.16.iso /mnt
    sudo /mnt/VBoxLinuxAdditions.run
    sudo umount /mnt
    rm VBoxGuestAdditions_5.0.16.iso
    sudo echo 'usr_local_site_socex /usr/local/site/socex vboxsf auto,rw,gid=1000,uid=1000 0 0' >> /etc/fstab
    sudo echo '/usr/local/site/socex-dep /usr/local/site/socex/node_modules none bind 0 0' >> /etc/fstab
fi

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

sudo mkdir -p /usr/local/site/socex
sudo chown vagrant -R /usr/local/site
sudo mount /usr/local/site/socex
mkdir -p /usr/local/site/socex-dep
sudo mount /usr/local/site/socex/node_modules
sudo rm /etc/nginx/nginx.conf
sudo ln /vagrant/server/nginx/config/darwin.conf /etc/nginx/nginx.conf
sudo service nginx restart
cd /usr/local/site/socex
./build.sh
