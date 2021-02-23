const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { errors } = require('celebrate')
const routes = require('./routes');
const helmet = require('helmet');

const app = express();

app.use(express.static(path.join('./', 'build')))
app.use(cors())
app.use(helmet());
app.use(bodyParser.json());
app.use(express.json());
app.use(routes);
app.use(errors());



module.exports = app;