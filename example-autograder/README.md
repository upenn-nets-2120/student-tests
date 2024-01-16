This is an example autograder, to upload it to gradescope, zip these files together and upload.

### IMPORTANT

You must add a `.env` file in this directory with the following variables:

```
SERVER_IP=...
SERVER_PORT=...
AUTH_TOKEN=...
```

These correspond to the IP and port of the EC2 instance running the server to store the data and student tests. The auth token is also the token specified by this server (if you're running that too, it's the same as the one in the `.env` file for the server).

MAKE SURE TO INCLUDE THE `.env` FILE WHEN YOU ZIP IT TOGETHER!
