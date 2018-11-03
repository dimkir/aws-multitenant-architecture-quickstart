'use strict';


module.exports = function({app, configuration, winston}){

//Configure AWS SDK
const AWS = require('aws-sdk');

//Include Custom Modules
const tokenManager = require('../lib/token-manager/token-manager.js');
const DynamoDBHelper = require('../lib/dynamodb-helper/dynamodb-helper.js');

// Configure AWS Region
AWS.config.update({region: configuration.aws_region});

// Create a schema
var tenantSchema = {
    TableName : configuration.table.tenant,
    KeySchema: [
        { AttributeName: "id", KeyType: "HASH"}  //Partition key
    ],
    AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" }
        // note that all other attributes are actually "free form" - and can be anything and do not have "hard definition"
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
};

app.get('/tenant/health', function(req, res) {
    winston.debug('GET tenant/health');
    console.log('console.log():: Reporting health ');

    res.status(200).send({service: 'Tenant Manager', isAlive: true});
});

// Create REST entry points
app.get('/tenant/:id', function (req, res) {
    winston.debug('GET tenant/:id');
    winston.debug('Fetching tenant: ' + req.params.id);

    // init params structure with request params
    var tenantIdParam = {
        id: req.params.id
    }

    tokenManager.getCredentialsFromToken(req, function(credentials) {
        // construct the helper object

        if ( null === credentials ) {
            return res.status(400).send({ Error: 'Error getting/hydrating credentials from token'});
        }
        var dynamoHelper = new DynamoDBHelper(tenantSchema, credentials, configuration);

        dynamoHelper.getItem(tenantIdParam, credentials, function (err, tenant) {
            if (err) {
                winston.error('Error getting tenant: ' + err.message);
                res.status(400).send('{"Error" : "Error getting tenant"}');
            }
            else {
                winston.debug('Tenant ' + req.params.id + ' retrieved');
                res.status(200).send(tenant);
            }
        });
    });
});

app.get('/tenants', function(req, res) {
    winston.debug('Fetching all tenants');

    tokenManager.getCredentialsFromToken(req, function(credentials) {
        var scanParams = {
            TableName: tenantSchema.TableName,
        }

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(tenantSchema, credentials, configuration);

        dynamoHelper.scan(scanParams, credentials, function (error, tenants) {
            if (error) {
                winston.error('Error retrieving tenants: ' + error.message);
                res.status(400).send('{"Error" : "Error retrieving tenants"}');
            }
            else {
                winston.debug('Tenants successfully retrieved');
                res.status(200).send(tenants);
            }

        });
    });
});

app.get('/tenants/system', function(req, res) {
    winston.debug('Fetching all tenants required to clean up infrastructure');
//Note: Reference Architecture not leveraging Client Certificate to secure system only endpoints. Please integrate the following endpoint with a Client Certificate.
    var credentials = {};
    tokenManager.getSystemCredentials(function (systemCredentials) {
        credentials = systemCredentials;
        var scanParams = {
            TableName: tenantSchema.TableName,
        }

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(tenantSchema, credentials, configuration);

        dynamoHelper.scan(scanParams, credentials, function (error, tenants) {
            if (error) {
                winston.error('Error retrieving tenants: ' + error.message);
                res.status(400).send('{"Error" : "Error retrieving tenants"}');
            }
            else {
                winston.debug('Tenants successfully retrieved');
                res.status(200).send(tenants);
            }

        });
    });
});

app.post('/tenant', function(req, res) {
    winston.debug('POST tenant');

    var credentials = {};
    tokenManager.getSystemCredentials(function (systemCredentials) {
        winston.debug(systemCredentials);
        credentials = systemCredentials;
        var tenant = req.body;
        winston.debug('Creating Tenant: ' + tenant.id);

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(tenantSchema, credentials, configuration);

        dynamoHelper.putItem(tenant, credentials, function (err, tenant) {
            if (err) {
                winston.error('Error creating new tenant: ' + err.message);
                res.status(400).send('{"Error" : "Error creating tenant"}');
            }
            else {
                winston.debug('Tenant ' + tenant.id + ' created');
                res.status(200).send({status: 'success'});
            }
        });
    })
});

/*
//add code to add disable flag to tenant
app.post('/disable', function(req, res) {
    var tenant = new Tenant(req.body);
    winston.debug('Disable Tenant: ' + tenant.id);
    tenant.save(function(err) {
        if (err) {
            winston.error('Error creating new tenant: ' + err.message);
            res.status(400);
            res.json(err);
        }
        else {
            winston.error('tenant' + tenant.id + 'created');
            res.json(tenant);
        }

    });
});
*/

app.put('/tenant', function(req, res) {
    winston.debug('Updating tenant: ' + req.body.id);
    tokenManager.getCredentialsFromToken(req, function(credentials) {
        // init the params from the request data
        var keyParams = {
            id: req.body.id
        }

        var tenantUpdateParams = {
            TableName: tenantSchema.TableName,
            Key: keyParams,
            UpdateExpression: "set " +
                "companyName=:companyName, " +
                "accountName=:accountName, " +
                "ownerName=:ownerName, " +
                "tier=:tier, " +
                "#status=:status",
            ExpressionAttributeNames: {
                '#status' : 'status'
            },
            ExpressionAttributeValues: {
                ":companyName": req.body.companyName,
                ":accountName": req.body.accountName,
                ":ownerName": req.body.ownerName,
                ":tier":req.body.tier,
                ":status":req.body.status
            },
            ReturnValues:"UPDATED_NEW"
        };

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(tenantSchema, credentials, configuration);

        dynamoHelper.updateItem(tenantUpdateParams, credentials, function (err, tenant) {
            if (err) {
                winston.error('Error updating tenant: ' + err.message);
                res.status(400).send('{"Error" : "Error updating tenant"}');
            }
            else {
                winston.debug('Tenant ' + req.body.title + ' updated');
                res.status(200).send(tenant);
            }
        });
    });
});

app.delete('/tenant/:id', function(req, res) {
    winston.debug('Deleting Tenant: ' + req.params.id);

    tokenManager.getCredentialsFromToken(req, function(credentials) {
        // init parameter structure
        var deleteTenantParams = {
            TableName : tenantSchema.TableName,
            Key: {
                id: req.params.id
            }
        };

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(tenantSchema, credentials, configuration);

        dynamoHelper.deleteItem(deleteTenantParams, credentials, function (err, product) {
            if (err) {
                winston.error('Error deleting tenant: ' + err.message);
                res.status(400).send('{"Error" : "Error deleting tenant"}');
            }
            else {
                winston.debug('Tenant ' + req.params.id + ' deleted');
                res.status(200).send({status: 'success'});
            }
        });
    });
});

    return app;
}