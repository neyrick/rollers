'use strict'

const config  = require('./config'),
      restify = require('restify');

const server = restify.createServer({
    name    : config.name,
    version : config.version
});


server.use(restify.plugins.bodyParser({ mapParams: true }));
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser({ mapParams: true }));
// server.use(restify.plugins.fullResponse());

server.listen(config.port, () => {


        console.log(
            '%s v%s ready to accept connections on port %s in %s environment.',
            server.name,
            config.version,
            config.port,
            config.env
        );

        require('./routes')({ server });

});
