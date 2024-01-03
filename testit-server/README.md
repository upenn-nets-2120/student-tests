# Testit Server

Here is the server for automated testing.

Create a `.env` file (in this directory) with `AUTH_TOKEN=...` which will store the token that any client will need to access the server (which will probably just be the Gradescope autograder - we don't want students accessing this server).

Run it with `docker-compose up`

Initial test with `curl -X GET http://localhost:3000/ -H "Authorization: auth_token_value"` if run on `localhost`
