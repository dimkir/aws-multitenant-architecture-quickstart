'use strict';

// Declare library dependencies
const AWS = require('aws-sdk');

//Configure Environment
const configModule = require('../config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);

//Configure Logging
const winston = require('winston');
winston.level = configuration.loglevel;

/**
 * Constructor function
 * @param tableDefinition The defintion of the table being used
 * @param configSettings Configuration settings
 * @constructor
 */
function DynamoDBHelper(tableDefinition, credentials, configSettings, callback) {
    this.tableDefinition = tableDefinition;
    this.tableExists = false;

}

/**
 * Query for items using the supplied parameters
 * @param searchParameters The search parameters
 * @param credentials The user creds
 * @param callback Callback function for results
 */
DynamoDBHelper.prototype.query = function(searchParameters, credentials, callback) {
    this.getDynamoDBDocumentClient(credentials, function (error, docClient) {
        if(!error){
            docClient.query(searchParameters, function(err, data) {
                if (err) {
                    winston.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                    callback(err);
                } else {
                    callback(null, data.Items);
                }
            });
        }
        else{
            winston.error(error);
            callback(error);
        }

    }.bind(this));
}

/**
 * Put an item into a table
 * @param item The item to be created
 * @param tableName The table to put it in
 * @param credentials User credentials
 * @param callback Callback with results
 */
DynamoDBHelper.prototype.putItem = function(item, credentials, callback) {
    winston.debug(`dynamodb-helper.putItem(item, credentials ,...)`);
    winston.debug(`.credentials: `);
    winston.debug(credentials);
    // 2018-10-09T00:59:35.152Z	95f3d798-cb5e-11e8-8b4a-bdc27c69891c	[winston] Attempt to write logs with no transports
    // {
    //     "message": {
    //         "claim": {
    //             "expired": false,
    //             "expireTime": null,
    //             "accessKeyId": "ASIAV3ZOX4IZZUB2GR5W",
    //             "sessionToken": "FQoGZXIvYXdzEIn//////////wEaDJIZtHRPQmUNP7bn1yLrAURnQcRBptAg1WfO+U+mnOqHSfA2VGLZ2nP5XtzhWR1s9ZpW9QXSQb3rA9sxJnBBUW09KxRKC3WqnTpYMPjsHnAeg4xW9+WsvlUGwGtbclTBycJqNKmXOo75x+nKf9RkUFb9YijYk9Haqh+6nOPAYTLxUyEtHPau4P5wedSZ+9XLZfxGRi2l/EhbDjXSZom9yhozs+fGtqQMFOYvd8SKP9cljul0PpCG4lYOvPL8Kq0nxNBlVHKJ1bf49FDi6rxZ0hGkFHZgw8P7vdyIvfjTmWEWMn1K++3VZ6ZAhNAm6mxXIewMeGXoCYgUduEol9Xv3QU=",
    //             "envPrefix": "AWS"
    //         }
    //     },
    //     "level": "debug"
    // }    
    winston.debug(`.item: `);
    winston.debug(item);

    this.getDynamoDBDocumentClient(credentials, function (error, docClient) {

        if ( error )
            return callback(error);

        var itemParams = {
            TableName: this.tableDefinition.TableName,
            Item: item
        }

        docClient.put(itemParams, function(err, data) {
            if (err)
                callback(err);
            else {
                callback(null, data);
            }
        });
    }.bind(this));
}

/**
 * Update and item in a table
 * @param productUpdateParams The parameters for the update
 * @param credentials User credentials
 * @param callback Callback with results
 */
DynamoDBHelper.prototype.updateItem = function(productUpdateParams, credentials, callback) {
    this.getDynamoDBDocumentClient(credentials, function (error, docClient) {
        docClient.update(productUpdateParams, function(err, data) {
            if (err)
                callback(err);
            else
                callback(null, data.Attributes);
        });
    }.bind(this));
}

/**
 * Get an item from a table
 * @param keyParams Parameters for the GET
 * @param tableName Table to get from
 * @param credentials User credentials
 * @param callback Callback with results
 */
DynamoDBHelper.prototype.getItem = function(keyParams, credentials, callback) {
    this.getDynamoDBDocumentClient(credentials, function (error, docClient) {
        var fetchParams = {
            TableName: this.tableDefinition.TableName,
            Key: keyParams
        }

        docClient.get(fetchParams, function(err, data) {
            if (err)
                callback(err);
            else
                callback(null, data.Item);
        });
    }.bind(this));
}

/**
 * Delete and item from a table
 * @param deleteItemParams Parameter for the delete
 * @param credentials User credentials
 * @param callback Callback with results
 */
DynamoDBHelper.prototype.deleteItem = function(deleteItemParams, credentials, callback) {
    this.getDynamoDBDocumentClient(credentials, function (error, docClient) {
        docClient.delete(deleteItemParams, function(err, data) {
            if (err)
                callback(err);
            else
                callback(null, data);
        });
    }.bind(this));
}

/**
 * Get all items from a table, using params to filter where necessary
 * @param scanParams Parameter for the scan
 * @param credentials User credentials
 * @param callback Callback with results
 */
DynamoDBHelper.prototype.scan = function(scanParams, credentials, callback) {
    this.getDynamoDBDocumentClient(credentials, function (error, docClient) {
        docClient.scan(scanParams, function(err, data) {
            if (err)
                callback(err);
            else
                callback(null, data.Items);
        });
    }.bind(this));
}

/**
 * Get all items matching the specified parameters
 * @param batchGetParams Parameter for the get
 * @param credentials User credentials
 * @param callback Callback with results
 */
DynamoDBHelper.prototype.batchGetItem = function(batchGetParams, credentials, callback) {
    this.getDynamoDBDocumentClient(credentials, function (error, docClient) {
        docClient.batchGet(batchGetParams, function(err, data) {
            if (err)
                callback(err);
            else
                callback(null, data);
        });
    }.bind(this));
}

/**
 * Create a new table
 * @param tableDefinition Structure of the table
 * @param credentials User credentials
 * @param callback Callback with results
 */
DynamoDBHelper.prototype.createTable = function(dynamodb, callback) {
   winston.debug(`dynamodb-helper.createTable(dynamodb ,...)`);

   var newTable = {
       TableName: this.tableDefinition.TableName,
   };
   dynamodb.describeTable(newTable, function (error, data) {

       if ( error ) winston.warn(`DynamoDBHelper.createTable()/dynamodb.describeTable(): ` + error);
       if (!error) {
           winston.debug("Table already exists: " + this.tableDefinition.TableName);
           callback(null);
       }
       else {
           dynamodb.createTable(this.tableDefinition, function (err, data) {
               if (err) {
                   winston.error("Unable to create table: " + this.tableDefinition.TableName);
                   winston.error(err);
                   callback(err);
               } else {
                   var tableName = {TableName: this.tableDefinition.TableName};
                   dynamodb.waitFor('tableExists', tableName, function (err, data) {
                       if (err)
                           callback(err);
                       else {
                           winston.debug("Created table. Table description JSON:", JSON.stringify(data, null, 2));
                           callback(null);
                       }
                   });
               }
           }.bind(this));
       }
   }.bind(this));
}

/**
 * DK> THIS SEEMS TO BE BROKEN AND NOT USED (at least in tenant-manager)
 * 
 * Determine if a table exists
 * @param tableName Name of the table to evaluate
 * @param credentials User credentials
 * @returns {Promise} Promise with results
 */
DynamoDBHelper.prototype.tableExists = function(tableName, credentials) {
    var promise = new Promise(function (reject, resolve) {
        getDynamoDB(credentials)
            .then(function (dynamodb) {
                var newTable = {
                    TableName: tableName,
                };
                dynamodb.describeTable(newTable, function (error, data) {
                    if (error) {
                        winston.error("Error describing table: ", error)
                    }
                    else {
                        resolve(true);
                    }
                });
            })
            .catch(function (error) {
                winston.error("Error describing table: ", error);
                reject(error);
            });
    });
    return promise;
}

/**
 * Get an instance of DynamoDB object intialized with user credentials
 * @param credentials User credentials
 * @param callback Callback with results
 */
DynamoDBHelper.prototype.getDynamoDB = function(credentials, callback) {
    try {
        var creds = {
            accessKeyId: credentials.claim.AccessKeyId,
            secretAccessKey: credentials.claim.SecretKey,
            sessionToken: credentials.claim.SessionToken,
            region: configuration.aws_region
        }

        var ddb = new AWS.DynamoDB(creds);
        if (!this.tableExists) {
            this.createTable(ddb, function (error) {
                if (error)
                    callback(error);
                else {
                    this.tableExists = true;
                    callback(null, ddb);
                }
            }.bind(this));
        }
        else
            callback(null, ddb);
    }
    catch (error) {
        callback(error);
    }
}

/**
 * Get an instance of DynamoDB DocumentClient object intialized with user credentials
 * @param credentials User credentials
 * @param callback Callback with results
 */
DynamoDBHelper.prototype.getDynamoDBDocumentClient = function(credentials, callback) {
    winston.debug(`dynamodb-helper.getDynamoDBDocumentClient(credentials ,...)`);
    winston.debug(`.credentials: `);
    winston.debug(credentials);
    try {
        var creds = {
            accessKeyId    : credentials.claim.AccessKeyId,
            secretAccessKey: credentials.claim.SecretKey,
            sessionToken   : credentials.claim.SessionToken,
            region         : configuration.aws_region
        }
        winston.debug(`Credentials for instantiating ddb & docClient: `);
        winston.debug(creds);

        
        var ddb = new AWS.DynamoDB(creds)
        var docClient = new AWS.DynamoDB.DocumentClient({ service: ddb });

        // var docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2'});
        // var ddb = new AWS.DynamoDB({ region: 'us-west-2'});

        if (!this.tableExists) {
            this.createTable(ddb, function (error) {
                if (error)
                    callback(error);
                else {
                    this.tableExists = true;
                    callback(null, docClient)
                }
            }.bind(this));
        }
        else
            callback(null, docClient);

    }
    catch (error) {
        callback(error);
    }
}

module.exports = DynamoDBHelper;