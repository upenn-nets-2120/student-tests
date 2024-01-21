# student-tests

This framework is for having student created tests that are run against each other.

The `testit-server` directory has a docker container that runs a database and server to store test cases. It should be run separately, and permanently up, probably on some EC2 instance. More instructions in that folder.

The `example-autograder` directory provides an example autograder that uses this student test case framework. More instructions in that folder.

## How to Use As a Instructor/Administrator

Follow the instructions above and in the other `README`s listed above.

## How to Use As a Student

Thank you for using this framework! It is actually really simple to use. It allows you to submit your own test cases that are then uploaded, and you can run your code against any other students' uploaded tests as well! To get started, you can upload your test cases in a file called `tests.json` just with your normal Gradescope submission. The structure of this file is listed below, but you can also look at the file itself for more details:

```json
[
  {
    "name": "Test case 1",
    "description": "optional desc",
    "test": {
      "command": "curl -X GET http://localhost:3000/",
      "response": {
        "status": 200,
        "body": "SERVER TEST INCORRECT"
      }
    }
  },
  ...
]
```

To add tests, add them to the list in this JSON file. The `name` is required, and it is the identifier of each test. Since test cases are shared between all students, the name MUST BE UNIQUE between all students. If you try uploading a test with a name that already exists, you will get an error message letting you know. However, if you upload a test with the same name as a test you have already uploaded, the old test will be completely overwritten and the new version will take its place.

The `description` field is optional, and it just adds a helpful description of what this test case does. When other students run this test case, they will see this description.

PLEASE USE HELPFUL NAMES AND DESCRIPTIONS. Please fill both of these fields out with good, descriptive messages so that other students know that these tests are doing. Badly named tests are subject to removal at the discretion of the assignment administrators.

There are a few other optional fields: the `public` field determines if the test case is public. It defaults to `true`, but if you want to write a test case that only you can access, then set this to false. However, as will be explained later, private tests do not count towards the total you need to see other test cases (see explanation of how tests work below).

The `test` field contains the actual content of the test. Currently, only `curl` commands are supported for this, but more support will be added for other options in the future such as Jest, JUnit, any command with output, any scripts with output, and possibly Playwright. More details on how to use the `curl` test are explained below.

### `curl` Tests:

To make a `curl` test, just write the exact `curl` command you would write if you were to test locally. Then, put the expected status code and body into the `response` field in the JSON, and that's it!

### How the Tests Work

To ensure the quality of the tests, in order to be able to upload them they must first pass the Assignment's Sample Solution (a "correct" version of how the assignment should be completed). Any tests submitted that pass this sample solution are automatically uploaded to the combined database. In order to help you debug your tests, you can also see the results of running your tests on the sample submission in Gradescope. They will appear with the added tag `SAMPLE SOLUTION RESULT: <Test Case Name>`.

Note that you do not need to re-submit the `tests.json` file each time, once the tests are uploaded there is no reason to resubmit them.

To further ensure fairness, by default students do not actually have access to running other students' test cases. In order to access the public database, you MUST first submit AT LEAST ONE PUBLIC test case. Once you have submitted at least one public test case, the autograder will automatically randomly sample a bunch of test cases from the database to run against your solution. The results of these test cases are displayed to you in gradescope. If you are one of the first people to submit test cases, and you want to try others out, you may want to wait a couple days or so. However, there is no need to actually resubmit on Gradescope; all you need to do is click the "Rerun Autograder" button, and it will automatically run any new tests on your active submission.

If you don't resubmit `tests.json`, and you have already submitted a public test case, then the random sample of other tests will still be run on your submission, so don't worry about resubmitting this! Additionally, if you submit just the `tests.json` file without your actual code for the assignment, then you can still see the result of running your tests on the sample submission, and if they pass they can still be uploaded to the database (but ofc they won't be run on your submission).

If at any points there are any error messages by the autograder, or you believe your test should be passing the sample solution but isn't, please contact the assignment administrators.

### Rating Tests

We realize that some test cases may be more thorough than others, and also it's possible that some extraneous tests can slip through the cracks into the pool. Because if this, there is a rating system for the tests. You can check out the associated website given by the administrators, which shows the uploaded public tests for each assignment. After logging in, you can upvote good test cases if they seem to work well, or downvote test cases if you think they are flawed. Furthermore, if you want to delete one of your test cases, you can do so here. Note that there is a limit of 10 tests max per student, so you must delete some tests if you want to upload a different one past this limit. THIS WEBSITE HAS NOT BEEN IMPLEMENTED YET, BUT IT WILL BE.


### Test Case Grades

For now, there will be a small percentage of the grade for uploading a test case. However, to ensure fairness, you will only get credit for test cases uploaded AT LEAST 3 DAYS before the deadline. More details will be given by the assignment administrators.
