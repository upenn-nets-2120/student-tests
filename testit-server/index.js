const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const port = 3000;

const url = process.env.DB_URL;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const dbName = 'tests-database';
let db, testsCollection;

// Auth middleware
const authorize = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token || token !== AUTH_TOKEN) {
    return res.status(403).send('Unauthorized');
  }

  next();
};
app.use(authorize);

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) {
    return console.log(err);
  }
  db = client.db(dbName);
  testsCollection = db.collection('tests');

  // Trying this each time should be fine, MongoDB handles it gracefully
  testsCollection.createIndex({ name: 1 }, { unique: true }, (err, result) => {
    if (err) {
      console.log('Error creating index:', err);
    } else {
      console.log('Index created:', result);
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
});

app.get('/', (req, res) => {
  res.status(200).send('ok');
});

app.post('/submit-tests', express.text({ type: 'application/json' }), async (req, res) => {
  let testCases;
  try {
    testCases = JSON.parse(req.body);
  } catch (err) {
    return res.status(400).send('Invalid JSON format');
  }

  const author = req.query.author;
  if (!author) {
    return res.status(400).send('Error: Author is required as a query parameter.');
  }

  const result = {failedToAdd: []};
  const processedTestCases = [];
  for (const testCase of testCases) {
    testCase.author = author;

    testCase.public ??= true;
    testCase.passedDefault ??= true;
    testCase.timesRan ??= 0;
    testCase.timesRanSuccessfully ??= 0;

    const existingTestCase = await testsCollection.findOne({ name: testCase.name });
    if (existingTestCase) {
      result.failedToAdd.push({"name": testCase.name, "reason": "Test case already exists"});
    }

    processedTestCases.push(testCase);
  }

  try {
    await testsCollection.insertMany(processedTestCases);
    result.success = true;

    const returnedTests = await testsCollection.find({ $or: [{ public: true }, { author: author }] }).toArray();
    result.tests = returnedTests;

    res.status(201).send(result);
  } catch (err) {
    result.success = false;
    res.status(500).send(result);
  }
});

// TODO: Add another route for uploading results of running tests
