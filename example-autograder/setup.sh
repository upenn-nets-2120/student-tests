#!/bin/bash

apt-get update
apt-get install -y python3 python3-pip curl nodejs npm

pip3 install requests

cd /autograder/source/sample-server

npm install

cd /autograder/source

if [ -f .env ]; then
    export $(cat .env | xargs)
fi

python3 /autograder/source/grader.py --setup
