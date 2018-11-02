
//  Express
const express = require('express');
const bodyParser = require('body-parser');

var app = express();

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    next();
});


//Configure Environment
const configModule = require('./lib/config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);


//Configure Logging
const winston = require('winston');
winston.level = configuration.loglevel;


require('./functions/auth-manager')({app, configuration, winston});


module.exports = app;



