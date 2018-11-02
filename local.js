#!/usr/bin/env node
'use strict';

const server = require('./server');

const listEndpoints = require('express-list-endpoints');
const listRoutes = require('express-list-routes');

const PORT = 8087;



console.log(JSON.stringify(listEndpoints(server), null,2));

// console.log(listRoutes(null, 'API:', server));

server.listen(PORT, (a,b)=>{
    console.log(`Listen: localhost:${PORT}`);
})