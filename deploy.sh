#!/usr/bin/env bash

SOCEX=`pwd`
mkdir -p static/id
mkdir static/md5
mkdir -p server/nginx/log
chmod 777 server/nginx/log

for i in node-gyp; do
    if [ 'Darwin' == `uname` ]; then
        npm install -g ${i}
    else
        sudo npm install -g ${i}
    fi
done

npm update
gulp
