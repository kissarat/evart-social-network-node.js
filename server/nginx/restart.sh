#!/usr/bin/env bash
brew services reload nginx
date +"%F %T" >> /tmp/socex-restart
