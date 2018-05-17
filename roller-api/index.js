'use strict'

const config  = require('./config'),
      restify = require('restify'),
      security = require('./security');

const server = restify.createServer({
    name    : config.name,
    version : config.version
});

server.pre(restify.plugins.pre.context());
server.pre(restify.plugins.pre.dedupeSlashes());
server.pre(security.authParser);

server.use(restify.plugins.bodyParser({ mapParams: true }));
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser({ mapParams: true }));
// server.use(restify.plugins.fullResponse());

server.listen(config.port, () => {

        security.initApiKeys( () => {

            console.log(
                '%s v%s ready to accept connections on port %s in %s environment.',
                server.name,
                config.version,
                config.port,
                config.env
            );

            server.get('/static/*', restify.plugins.serveStatic({ directory: './static', default: 'index.html', appendRequestPath: false}));

            require('./routes')({ server });
        }, (error) => {
            console.log('Error when loading current API keys: ' + error);
        });
});
