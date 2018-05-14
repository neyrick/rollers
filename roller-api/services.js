const config  = require('./config');
const consts = require('./consts');
const queries = require('./queries');
const security = require('./security');


module.exports = {
  getProfileByName: getProfileByName,
  login: login
};


function standardError(res, errorCode, errorMessage, next) {
    res.send(500, { errorCode: errorCode, errorMessage: errorMessage});
    next(false);
}

function getProfileByName(req, res, next) {

    queries.getProfileByName(req.params.name, function (data) { res.send(200, data) }, function (err) {console.log('pouet'); res.send(500, err)});
    next();
}

function login(req, res, next) {
    var email = req.params.email;
    var password = req.params.password;

    if ((typeof email === "undefined") || (typeof password === "undefined")) {
           return standardError(res, 'CREDENTIALS', 'Vous devez fournir un email et un mot de passe.' + JSON.stringify(req.toString()), next);
    }

    queries.authenticate(email, password, profile => {

        if (profile.status == 4) {
            return standardError(res, 'STATUS_BANNED', 'Compte désactivé', next);
        }
        else if (profile.status == 2) {
            return standardError(res, 'STATUS_PENDING', 'Compte en attente de validation', next);
        }

        if (typeof req.get('apikey') != "undefined") {
            security.clearApiKey(req.get('apikey'));
        }
        
        security.createNewKey(profile.id, key => {
            res.send({ id : 0, key : key, gui : 'regular'});
            next();
        }, function(err) { standardError(res, 'CREATE_KEY', err, next); });
    }, (code, error) => standardError(res, code, error, next));
};

