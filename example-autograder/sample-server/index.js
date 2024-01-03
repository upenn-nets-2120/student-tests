const express = require('express');
const app = express();
const port = 3000;

const AUTH_TOKEN = process.env.AUTH_TOKEN;

// THIS WILL PROBABLY BE USING VUE.js instead later, this version is just to test
// this is the sample server solution provided by the homework to run test cases against

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

app.get('/', (req, res) => {
  res.send('SERVER TEST');
});
