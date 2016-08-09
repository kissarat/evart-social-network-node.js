#!/usr/bin/env bash

mkdir -p static/id
mkdir static/md5
mkdir -p server/nginx/log
chmod 777 server/nginx/log
npm update
npm run build
