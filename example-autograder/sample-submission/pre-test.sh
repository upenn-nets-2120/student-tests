#!/bin/bash

npm install

mvn clean install -DskipTests

node index.js &
