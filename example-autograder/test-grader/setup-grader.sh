#!/bin/bash

apt-get update
apt-get install -y python3 python3-pip curl nodejs npm openjdk-21-jdk maven

pip3 install requests

cd /autograder/source/test-grader

if [ -f .env ]; then
    export $(cat .env | xargs)
fi

cd /autograder/source/sample-submission

python3 /autograder/source/test-grader/grader.py --setup
