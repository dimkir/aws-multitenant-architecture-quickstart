
//  Express
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const RequestDebug = require('request-debug');
RequestDebug(request);


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
    // intercept OPTIONS method
    console.log(`request.method = ` +  req.method);
    if ('OPTIONS' == req.method) {
        console.log(`Sending 200 for options`);
        res.send(200);
    }
    else {
        next();
    }    
    // next();
});


//Configure Environment
const configModule = require('./lib/config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);


//Configure Logging
const winston = require('winston');
winston.level = configuration.loglevel;
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({ format: winston.format.simple(), level: 'debug' }),       
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
    //   new winston.transports.File({ filename: 'error.log', level: 'error' }),
    //   new winston.transports.File({ filename: 'combined.log' })
    ]
});
  
  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  // 
// // if (process.env.NODE_ENV !== 'production') {
    // logger.add(new winston.transports.Console({
    //  format: winston.format.simple(),
    //  level: 'debug',
    // }));
// // }

winston.add(logger);
// TODO: add winston engine

// L0
require('./functions/user-manager')({app, configuration, winston});
require('./functions/tenant-manager')({app, configuration, winston});

// L1
require('./functions/auth-manager')({app, configuration, winston});
require('./functions/system-registration')({app, configuration, winston, request});
require('./functions/tenant-registration')({app, configuration, winston, request});

// L3
require('./functions/order-manager')({app, configuration, winston});
require('./functions/product-manager')({app, configuration, winston});


module.exports = app;



