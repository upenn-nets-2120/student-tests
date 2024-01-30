const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const app = express();
app.use(cors());
const port = 3000;

const url = process.env.DB_URL;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const SIGNING_TOKEN = process.env.SIGNING_TOKEN;
const dbName = 'tests-database';
let db;

// Auth middleware (only for Administrators/Gradescope)
const authorize = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token || token !== AUTH_TOKEN) {
    return res.status(403).send('Unauthorized');
  }

  next();
};

// Middleware that with authenticate users (students) when they're logged in
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token == null) {
    return res.sendStatus(403);
  }

  if (token == 0) {
    next();
  } else {
    jwt.verify(token, SIGNING_TOKEN, (err, user) => {
      if (err) {
        return res.status(403).send('Token expired');
      }
      req.user = user;
      next();
    });
  }
};

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) {
    return console.log(err);
  }
  db = client.db(dbName);
  db.createCollection('users', (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Created users collection");
    }
  });
  const users = db.collection('users');
  users.createIndex({ username: 1 }, { unique: true }, (err, result) => {
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

app.post('/set-accounts', authorize, express.json(), async (req, res) => {
  const users = db.collection('users');
  const accounts = req.body;

  if (!Array.isArray(accounts)) {
    return res.status(400).send('Input should be an array of user accounts');
  }

  try {
    await users.deleteMany({});
  } catch (err) {
    return res.status(500).send('Failed to delete existing accounts');
  }

  const preparedAccounts = await Promise.all(accounts.map(async account => {
    const hashedPassword = await bcrypt.hash(account.password, 10);
    return { ...account, password: hashedPassword };
  }));

  try {
    await users.insertMany(preparedAccounts, { ordered: false });
    res.status(201).send('Accounts created');
  } catch (err) {
    res.status(500).send('Some accounts could not be created due to errors');
  }
});

app.post('/login', express.json(), async (req, res) => {
  if (!req.body) {
    return res.status(400).send('No credentials provided');
  }
  const { username, password } = req.body;
  const users = db.collection('users');
  const user = await users.findOne({ username });

  if (user) {
    if (await bcrypt.compare(password, user.password)) {
      const { password, ...userToSign } = user;
      const token = jwt.sign(userToSign, SIGNING_TOKEN, { expiresIn: '1w' });
      res.json({ ...userToSign, token });
    } else {
      res.status(400).send('Invalid password');
    }
  } else {
    res.status(400).send('Invalid username');
  }
});

app.get('/', (req, res) => {
  res.status(200).send('ok');
});

app.get('/get-collections', async (req, res) => {
  db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Error listing collections:', err);
      return res.status(500).send('Failed to retrieve collections');
    }

    const collectionNames = collections.map(collection => collection.name);
    const filteredCollectionNames = collectionNames.filter(name => !name.startsWith('system.'));

    res.status(200).json(filteredCollectionNames);
  });
});

// TODO: Make sure visibility works properly with this route
// TODO: Make filtering done as part of the mongo query?
app.get('/get-tests/:assignmentName', authenticateToken, (req, res) => {
  const assignmentName = req.params.assignmentName;
  const collection = db.collection(`tests-${assignmentName}`);

  const userIsAdmin = req.user?.admin ?? false;

  collection.find(userIsAdmin ? {} : { public: true }).toArray((err, items) => {
    if (err) {
      res.status(500).send('Error fetching tests from database');
      return;
    }

    items = items.map(item => ({
      ...item,
      numLiked: Array.isArray(item.studentsLiked) ? item.studentsLiked.length : 0,
      numDisliked: Array.isArray(item.studentsDisliked) ? item.studentsDisliked.length : 0,
      userLiked: Array.isArray(item.studentsLiked) ? item.studentsLiked.includes(req.user?.username) : false,
      userDisliked: Array.isArray(item.studentsDisliked) ? item.studentsDisliked.includes(req.user?.username) : false,
    }));

    if (!userIsAdmin) {
      items = items.map(({ test, studentsRan, studentsRanSuccessfully, studentsLiked, studentsDisliked, public, visibility, isDefault, ...rest }) => rest);
    }

    res.status(200).json(items);
  });
});

app.delete('/delete-assignment/:assignmentName', authorize, async (req, res) => {
  const assignmentName = req.params.assignmentName;
  const collectionName = `tests-${assignmentName}`;

  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    return res.status(404).send('Assignment collection not found');
  }

  db.collection(collectionName).drop((err, delOK) => {
    if (err) {
      return res.status(500).send('Failed to delete assignment collection');
    }
    if (delOK) {
      console.log("Assignment collection deleted");
      res.status(200).send('Assignment collection deleted successfully');
    }
  });
});

app.delete('/delete-tests/:assignmentName', authorize, (req, res) => {
  const assignmentName = req.params.assignmentName;
  const collection = db.collection(`tests-${assignmentName}`);

  collection.deleteMany({}, (err, result) => {
    if (err) {
      res.status(500).send('Error deleting tests from database');
      return;
    }

    res.status(200).send('Deleted all tests from database');
  });
});

app.delete('/delete-test/:assignmentName', authorize, (req, res) => {
  const assignmentName = req.params.assignmentName;
  const collection = db.collection(`tests-${assignmentName}`);

  const testName = req.query.testName;
  const testId = req.query.testId;

  let deleteCriteria;
  if (testName) {
    deleteCriteria = { name: testName };
  } else if (testId) {
    deleteCriteria = { _id: new mongodb.ObjectId(testId) };
  } else {
    return res.status(400).send('Error: testName or testId query parameter is required.');
  }

  collection.deleteOne(deleteCriteria, (err, result) => {
    if (err) {
      res.status(500).send('Error deleting the test from database');
      return;
    }
    if (result.deletedCount === 0) {
      res.status(404).send('Test not found or already deleted');
      return;
    }
    res.status(200).send('Test deleted successfully');
  });
});

app.post('/submit-tests/:assignmentName', authorize, express.json(), async (req, res) => {
  const assignmentName = req.params.assignmentName;
  const collection = db.collection(`tests-${assignmentName}`);

  // Trying this each time should be fine, MongoDB handles it gracefully
  collection.createIndex({ name: 1 }, { unique: true }, (err, result) => {
    if (err) {
      console.log('Error creating index:', err);
    } else {
      console.log('Index created:', result);
    }
  });

  let testCases = req.body;

  const author = req.query.student_id;
  if (!author) {
    return res.status(400).send('Error: Author is required as a query parameter.');
  }
  console.log("Recieving tests from Student ID " + author);

  const numPublicTestsForAccess = req.query.num_public_tests ?? 1

  const result = {failedToAdd: []};
  const processedTestCases = [];
  for (const testCase of testCases) {
    testCase.author = author;

    testCase.timesRan = 0;
    testCase.timesRanSuccessfully = 0;
    testCase.numStudentsRan = 0;
    testCase.numStudentsRanSuccessfully = 0;
    testCase.studentsRan = [];
    testCase.studentsRanSuccessfully = [];
    testCase.studentsLiked = [];
    testCase.studentsDisliked = [];
    testCase.createdAt = new Date();
    testCase.public ??= true;
    testCase.visibility = "limited"; // 3 options, full (actual content of test can be seen), limited (only name, description, and feedback), none (only author can see)
    testCase.isDefault = false; // default would be true for instructor-created test cases that show up even if a student hasn't submitted any tests

    if (testCase.author === -1) {
      testCase.isDefault = true;
    }

    const existingTestCase = await collection.findOne({ name: testCase.name });
    if (existingTestCase) {
      if (existingTestCase.author === author) {
        // Author is the same, update the existing test case
        await collection.updateOne({ name: testCase.name }, { $set: testCase });
        console.log("Test " + testCase.name + " updated!");
      } else {
        // Different author, cannot overwrite
        console.log("Test " + testCase.name + " already exists by a different author!");
        result.failedToAdd.push({ "name": testCase.name, "reason": "Test case already exists by a different author!" });
      }
    } else {
      processedTestCases.push(testCase);
    }
  }

  try {
    if (processedTestCases.length > 0) {
      await collection.insertMany(processedTestCases);
    }
    result.success = true;

    const authorPublicTestCount = await collection.aggregate([
      { $match: { author: author, public: true } },
      { $group: { _id: "$author", count: { $sum: 1 } } }
    ]).toArray();

    if (authorPublicTestCount.length > 0 && authorPublicTestCount[0].count >= numPublicTestsForAccess) {
      result.tests = await collection.find({ $or: [{ public: true }, { author: author }, { isDefault: true }] }).toArray();
    } else {
      result.tests = await collection.find({ isDefault: true }).toArray();
    }

    res.status(201).send(result);
  } catch (err) {
    result.success = false;
    console.log("Failed to upload tests:", err)
    res.status(500).send(result);
  }
});

app.post('/submit-results/:assignmentName', authorize, express.json(), async (req, res) => {
  const assignmentName = req.params.assignmentName;
  const collection = db.collection(`tests-${assignmentName}`);

  let data = req.body;

  const author = req.query.student_id;
  if (!author) {
    return res.status(400).send('Error: Author is required as a query parameter.');
  }
  console.log("Recieving results from Student ID " + author);

  const result = { failedToUpdate: [] };
  for (const testResult of data) {
    try {
      // Increment timesRan and timesRanSuccessfully
      await collection.updateOne(
        { name: testResult.name },
        { $inc: { timesRan: 1, timesRanSuccessfully: testResult.passed ? 1 : 0 } }
      );

      // Update numStudentsRan and numStudentsRanSuccessfully only if this student has not run this test before
      const updateFields = {};
      const addToSetFields = { $addToSet: {} };

      const testCase = await collection.findOne({ name: testResult.name });
      if (testCase && !testCase.studentsRan.includes(author)) {
        updateFields.numStudentsRan = 1;
        addToSetFields.$addToSet.studentsRan = author;
      }
      if (testResult.passed && testCase && !testCase.studentsRanSuccessfully.includes(author)) {
        updateFields.numStudentsRanSuccessfully = 1;
        addToSetFields.$addToSet.studentsRanSuccessfully = author;
      }

      await collection.updateOne(
        { name: testResult.name },
        { $inc: updateFields, ...addToSetFields }
      );
    } catch (err) {
      console.log("Error updating test result for:", testResult.name, err);
      result.failedToUpdate.push({ "name": testResult.name, "reason": "Error in updating the database." });
    }
  }

  result.success = result.failedToUpdate.length === 0;
  res.status(result.success ? 200 : 500).send(result);
});

app.post('/like-test/:assignmentName/:testId', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(403).send('Not authorized to like tests');
  }
  const { assignmentName, testId } = req.params;
  const student = req.user.username;

  const collection = db.collection(`tests-${assignmentName}`);
  const test = await collection.findOne({ _id: new mongodb.ObjectId(testId), studentsLiked: student });
  if (test) {
    return res.status(400).send('Test already liked');
  }

  await collection.updateOne({ _id: new mongodb.ObjectId(testId) }, { $pull: { studentsDisliked: student } });
  await collection.updateOne({ _id: new mongodb.ObjectId(testId) }, { $addToSet: { studentsLiked: student } });

  res.status(200).send('Test liked successfully');
});

app.post('/dislike-test/:assignmentName/:testId', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(403).send('Not authorized to dislike tests');
  }
  const { assignmentName, testId } = req.params;
  const student = req.user.username;

  const collection = db.collection(`tests-${assignmentName}`);
  const test = await collection.findOne({ _id: new mongodb.ObjectId(testId), studentsDisliked: student });
  if (test) {
    return res.status(400).send('Test already disliked');
  }

  await collection.updateOne({ _id: new mongodb.ObjectId(testId) }, { $pull: { studentsLiked: student } });
  await collection.updateOne({ _id: new mongodb.ObjectId(testId) }, { $addToSet: { studentsDisliked: student } });

  res.status(200).send('Test disliked successfully');
});

app.delete('/delete-test/:assignmentName/:testId', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(403).send('Not authorized to delete tests');
  }
  const { assignmentName, testId } = req.params;
  const collection = db.collection(`tests-${assignmentName}`);

  const testCase = await collection.findOne({ _id: new mongodb.ObjectId(testId) });
  if (!testCase) {
    return res.status(404).send('Test not found');
  }

  const userIsAdmin = req.user.admin;
  const userIsAuthor = req.user.gradescope_id === testCase.author;

  if (!userIsAdmin && !userIsAuthor) {
    return res.status(403).send('Not authorized to delete this test');
  }

  const result = await collection.deleteOne({ _id: new mongodb.ObjectId(testId) });
  if (result.deletedCount === 0) {
    return res.status(500).send('Failed to delete the test');
  }

  res.status(200).send('Test deleted successfully');
});

// TODO: Remove this eventually
app.get('/view-tests/:assignmentName', (req, res) => {
  const assignmentName = req.params.assignmentName;
  const collection = db.collection(`tests-${assignmentName}`);

  collection.find({}).toArray((err, items) => {
    if (err) {
      res.status(500).send('Error fetching tests from database');
      return;
    }

    let html = '<table border="1">';
    html += '<tr><th>ID</th><th>Name</th><th>Description</th><th>Command</th><th>Response Status</th><th>Response Body</th><th>Author</th><th>Public</th><th>Visibility</th><th>Is Default</th><th>Created At</th><th>Times Ran</th><th>Times Ran Successfully</th><th>Num Students Ran</th><th>Num Students Ran Successfully</th></tr>';

    items.forEach(test => {
      html += `<tr>`;
      html += `<td>${test._id}</td>`;
      html += `<td>${test.name}</td>`;
      html += `<td>${test.description}</td>`;
      html += `<td>${test.test.command}</td>`;
      html += `<td>${test.test.response.status}</td>`;
      html += `<td>${JSON.stringify(test.test.response.body)}</td>`;
      html += `<td>${test.author}</td>`;
      html += `<td>${test.public}</td>`;
      html += `<td>${test.visibility}</td>`;
      html += `<td>${test.isDefault}</td>`;
      html += `<td>${test.createdAt}</td>`;
      html += `<td>${test.timesRan}</td>`;
      html += `<td>${test.timesRanSuccessfully}</td>`;
      html += `<td>${test.numStudentsRan}</td>`;
      html += `<td>${test.numStudentsRanSuccessfully}</td>`;
      html += `</tr>`;
    });

    html += '</table>';

    res.send(html);
  });
});
