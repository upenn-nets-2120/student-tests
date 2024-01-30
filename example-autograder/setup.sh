#!/bin/bash

apt-get update
apt-get install -y python3 python3-pip curl nodejs npm openjdk-21-jdk maven

pip3 install requests

cd /autograder/source/sample-server

npm install

cd /autograder/source/sample-java-project

mvn clean install -DskipTests

cd /autograder/source

python3 /autograder/source/grader.py --setup
