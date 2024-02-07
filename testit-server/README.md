# Testit Server

This is the server for automated testing and database for storing the test cases.

To set this up, first create a `.env` file (in this directory) with the following fields:

```
SERVER_IP=...
SERVER_PORT=...
AUTH_TOKEN=...
SIGNING_TOKEN=...
```

The first two are the IP and port that this server will be running on (e.g. the IP of the EC2 instance). They should match what's put in the corresponding fields in the `.env` of any `example-autograder`.

The `AUTH_TOKEN` will store the token that any client will need to access the server with authority (which is, for now, just the Gradescope autograder (and manual curl requests) - we don't want students accessing this server). Therefore, the `.env` file in any `example-autograder` will need to include the same value for this variable.

The `SIGING_TOKEN` will store the token used to sign account logins for the frontend. It can be anything, so you can just generate a random string for this.

You can run the database and the frontend with `docker-compose up --build`

### Administrative Setup

You will need to create accounts for every student once starting the containers before it can be used. To do this, we suggest creating a json file to store the account data. See `frontend/accounts.json` for an example as to what an account might look like.

```json
[
  {
    "username": "admin",
    "id": "-1",
    "admin": true,
    "password": "sample-admin-password"
  },
  ...
]
```

The `id` field NEEDS TO BE the Gradescope email of the user of the corresponding account, but the password can be whatever. For ease, we suggest making it the PennID. The username is the Pennkey of the student. Any student account should have `admin` set to false. If `admin` is true, then the user can delete and like any test, and see any test (including private ones). For convenience, we have provided a simple python program that parses the download `.csv` of students from Gradescope and creates this json file. Note however that it ignores any students without an email or ID, and CRUCIALLY, it ignores any non-Penn emails (because we need their Pennkey, which is the begining of the email if it's a Penn email). Therefore, for students that have a non-Penn email, you will need to manually add those accounts to the end of this json file (for the username, you will need to manually find their Pennkey) (make sure the email is still the Gradescope email though).

Finally, THERE MUST BE AN "ADMIN" ACCOUNT. You need to add one account with username `admin`, id `-1`, and the `admin` field set to true. The password can be whatever you wish. This is important as this is the account that Gradescope will be using to submit TAs' default tests.

Finally, once this json document has been created, you can upload it to the running server with

```curl -X POST http://{SERVER_IP}:{SERVER_PORT}/create-accounts -H "Authorization: {AUTH_TOKEN}" -H "Content-Type: application/json" -d @accounts.json```

If you pass in the extra query parameter of `reset=True`, then all accounts will be deleted before making the ones uploaded. Otherwise, the new ones are just added to the old ones. Also note that you need to authorization token to perform this "high level" action.

There are many other routes in the server that you can use for testing/administrating, and you can check out `index.js` to see what they are. You can just then form your own `curl` requests to use those routes as you wish.
