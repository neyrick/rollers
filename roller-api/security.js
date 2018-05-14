var jwt = require('jwt-simple');
var config = require("./config.js");
var crypto = require("crypto");
const queries = require('./queries');

var apikeys = {};

var publicResources = ['/login', '/expireToken', '/setting/pic/', '/status', '/secureStore', '/securePerform', '/planning', '/setting'];

function isRestricted(url) {
    return !publicResources.some(function (item) {
        return (url.indexOf(item) == 0);
    });
}

function isKeyValid(key) {
    var registered = apikeys[key];
    if ( typeof registered == "undefined")
        return false;
    if ( typeof registered.idprofile == "undefined")
        return false;
//    if (registered.idprofile !== idprofile)
//        return false;
    return true;
}

/*
function createToken(pm_idprofile, pm_apikey) {
    return jwt.encode({
        idprofile : pm_idprofile,
        apikey : pm_apikey,
    }, config.jwt.secret);
};
*/

function createApiKey(idprofile) {
    var newkey = crypto.randomBytes(20).toString('hex') + Date.now();
    apikeys[newkey] = { idprofile: idprofile };
    return newkey;
};


exports.genPassword = function() {
        return Math.random().toString(36).slice(-8);
};

exports.hashPassword = function (password) {
    return crypto.createHash('sha1').update(password).digest().toString('hex');
};

exports.crossDomainHeaders = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', config.http.allowedOrigins);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');

    next();
};

exports.requireLoggedIn = function(req, res, next) {
	if ((typeof req.user == "undefined") || (req.user == null) || (req.user == '')) {
	    console.log("Restriction logged-in");
	    res.send(403, 'Fonction réservée aux utilisateurs connectés');
	    return;
	}
        return next();
};

exports.authParser = function(req, res, next) {

    if (!req.getPath().startsWith('/api/')) {
        //console.log('Auth parser skipped');
        return next();
    }
//        console.log('Auth parser used');

    if (req.headers && req.headers.authorization) {
        var tokenMatch = req.headers.authorization.match(/^Bearer (.*)$/);
        if (tokenMatch) {
            var apikey = tokenMatch[1];
            req.set('apikey', apikey);
            if (!isKeyValid(authdata.apikey)) {
                console.log("URL: " + req.url);
                console.log("Token: " + tokenMatch[1]);
                console.log("Clé invalide: " + JSON.stringify(authdata));
            }
            var keydata = apikeys[apikey];
            req.set('idprofile', keydata.idprofile);
            req.set('sessiondata', keydata);
        } else {
            console.log("Token invalide");
        }
    }
    return next();
};

exports.createActionCode = function() {
    return crypto.randomBytes(20).toString('hex');
};

exports.clearApiKey = function(key) {
    delete apikeys[key];
    deleteOldKey(key, function(){}, function(err){
        console.log('Error when deleting key ' + key + ": " + err);
    });
};

exports.clearAllApiKeys = function(idprofile, callback, error) {
    var todelete = [];
    for (key in apikeys) {
        if (apikeys[key].idprofile == idprofile) todelete.push(key);
    }

    queries.deleteAllKeys(idprofile, () => {
        todelete.forEach(function(key) {
            delete apikeys[key];
            callback();
        });  
    }, error);


};

exports.initApiKeys = function(rawkeys) {
    apikeys = {};
    rawkeys.forEach(function(rawkey) {
        apikeys[rawkey.key] = { idprofile: rawkey.idprofile};
    });
};

exports.createNewKey = function(pm_idprofile, callback, error) {
    var apikey = createApiKey(pm_idprofile);
    queries.createKey(pm_idprofile, apikey, () => {
        callback(apikey);
    }, error);
}
