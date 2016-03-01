#!/usr/bin/env bash

set -e

SERVER=/home/ubuntu/www/socex/server
NAME=socex
PID=/run/$NAME.pid
LOG=/var/log/socex

start()
{
    if [ -z $LOG ]
    then
        mkdir $LOG
    fi
    /usr/local/bin/forever start  --pidFile $PID $SERVER/server.js -o $LOG/output.log -e $LOG/error.log
}

stop()
{
    /usr/local/bin/forever stop  --pidFile $PID $SERVER/server.js
}


case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        start
        ;;
    *)
	    echo "Usage: "$1" {start|stop|restart}"
	    exit 1
esac

exit 0
