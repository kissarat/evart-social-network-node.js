#!/bin/bash

npm update
cd client
bower update
cd ../server
npm update
cd ../test
npm update
