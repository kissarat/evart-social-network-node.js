#!/usr/bin/env bash

SOCEX=/usr/local/site/socex
cd $SOCEX

if [ ! -x static ]; then
    mkdir -p static/md5
    mkdir static/id
fi

if [ ! -x server/nginx/log ]; then
    mkdir -p server/log
    chmod 777 server/log
fi

if [ ! -x client/lib ]; then
    mkdir node_modules
    ln -s $SOCEX/node_modules client/lib
    npm update
fi

npm run build
