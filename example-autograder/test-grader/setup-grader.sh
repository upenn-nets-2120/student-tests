#!/bin/bash

apt-get update
apt-get install -y python3 python3-pip curl nodejs npm

pip3 install requests

cd /autograder/source/sample-server

bash /autograder/source/sample-server/setup-server.sh

cd /autograder/source/test-grader

if [ -f .env ]; then
    export $(cat .env | xargs)
fi

python3 /autograder/source/test-grader/grader.py --setup
