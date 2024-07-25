const express = require('express');
const bodyParser = require('body-parser');
const authenticationRoutes = require('./authentication');
const { auth, DB } = require('./config');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', authenticationRoutes);

app.get('/', (req, res) => {
  res.send('Success');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
