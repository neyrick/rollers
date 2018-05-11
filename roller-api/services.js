const config  = require('./config');
const consts = require('./consts');
const queries = require('./queries');
const security = require('./security');


module.exports = {
  getProfileByName: getProfileByName,
  login: login
};


function getProfileByName(req, res, next) {

    queries.getProfileByName(req.params.name, function (data) { res.send(200, data) }, function (err) {console.log('pouet'); res.send(500, err)});
    next();
}

function login(email, password, callback, error) {

    queries.authenticate(email, password, profile => {

        if (profile.status == 4) {
            error('STATUS_BANNED', 'Compte désactivé');
        }
        else if (profile.status == 2) {
            error('STATUS_PENDING', 'Compte en attente de validation');
        }

        if (typeof req.apikey != "undefined") {
            security.clearApiKey(req.apikey);
        }
        
        security.createNewKey(profile.id, key => {
                res.send({ id : 0, key : key, gui : 'regular'});
        }, error);
    });
};

