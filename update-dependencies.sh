#!/bin/bash

if [ -x /usr/local/bin/brew ]
then
    npm install -g coffee-script
    npm install -g gulp
    npm install -g bower
else
    sudo npm install -g coffee-script
    sudo npm install -g gulp
    sudo npm install -g bower
fi
npm update
cd client
bower update
cd ../server
npm update
cd ../test
npm update
