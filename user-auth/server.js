const express = require('express');
const bodyParser = require('body-parser');
const authenticationRoutes = require('./routes/authentication');
const userRoutes = require('./routes/users');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authenticationRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
