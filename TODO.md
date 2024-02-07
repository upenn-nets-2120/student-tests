Here is an ordered list of todos and other things to work on for this framework:

1. Merge in JUnit 4 tests support and bug fixes https://github.com/upenn-nets-2120/student-tests/tree/junit-testing
2. Merge in few Frontend https://github.com/upenn-nets-2120/student-tests/pull/2
3. Fix security vulnerabilities (ask @JHawk0224)
4. Make sure default tests are always run (from Gradescope files), e.g. even if student tests don’t pass (so default tests need to be uploaded to Gradescope every time the TA submits the autograder). Also make sure these default tests are run first to prevent server crashes affecting them.
5. Give useful feedback to students if tests.json is formatted incorrectly, e.g. if the test type field isn’t there, if it isn’t valid json, etc. Also ensure that the required fields are there like name, etc.
6. Set up/allow only https (port 443), also Elastic IP and A record for domain name
7. Make sure that when submitting identical tests the data isn’t actually overwritten on the backend, only if there is an update to some field.
8. Keep a log of the autograder’s backend’s print statement (at least most recent 1000 or so) to see why server goes down if so
9. Finish implementing grade for numPublicTestsForAccess, so the autograder gives submitTestsScore points only if numPublicTestsForAccess public tests were submitted at least timeToDeadline before the assignment deadline.
10. Add backend support for unliking and undisliking and integrate with frontend
11. Add limit to number of autograder re-runs so not too frequent
12. Add support for running scripts as test cases
13. Tag tests with specific sections of an assignment, and display on website/filter by tag
14. Finish implementing visibility levels for tests (e.g. see actual content of tests depending on visibility flag, or just name and description, or what outputs to students when run in Gradescope). Also integrate with default tests so some can be completely hidden while others are displayed.
15. Somehow allow students to rerun same suite of student tests twice in a row
16. Support for other types of tests like Jest and playwright
17. Finish TODOs written in codebase
18. Resolve dependabot vulnerability alerts
19. Implement test case similarity checking somehow to prevent very similar tests
