const app  = require('./server');
// @ts-ignore
const { $configuration:  configuration } = app;
 

// Start the servers
app.listen(configuration.port.tenant);
console.log(configuration.name.tenant + ' service started on port ' + configuration.port.tenant);