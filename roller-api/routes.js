'use strict'

const queries  = require('./queries');

module.exports = function(ctx) {

    const server = ctx.server

    // assign collection to variable for further use
//    const collection = db.collection('todos')
/*
    server.post('/todos', (req, res, next) => {

        // extract data from body and add timestamps
        const data = Object.assign({}, req.body, {
            created: new Date(),
            updated: new Date()
        })

        // insert one object into todos collection
        collection.insertOne(data)
            .then(doc => res.send(200, doc.ops[0]))
            .catch(err => res.send(500, err))

        next()

    })
*/
    server.get('/profile/:name', (req, res, next) => {

        queries.getProfileByName(req.params.name, function (data) { res.send(200, data) }, function (err) {res.send(500, err)});

        next();

    })
/*
    server.put('/todos/:id', (req, res, next) => {

        // extract data from body and add timestamps
        const data = Object.assign({}, req.body, {
            updated: new Date()
        })

        // build out findOneAndUpdate variables to keep things organized
        let query = { _id: req.params.id },
            body  = { $set: data },
            opts  = {
                returnOriginal: false,
                upsert: true
            }

        // find and update document based on passed in id (via route)
        collection.findOneAndUpdate(query, body, opts)
            .then(doc => res.send(204))
            .catch(err => res.send(500, err))

        next()

    })

    server.del('/todos/:id', (req, res, next) => {

        // remove one document based on passed in id (via route)
        collection.findOneAndDelete({ _id: req.params.id })
            .then(doc => res.send(204))
            .catch(err => res.send(500, err))

        next()

    })
*/
};

