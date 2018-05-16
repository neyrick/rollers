const config  = require('./config');
const consts = require('./consts');
const queries = require('./queries');
const security = require('./security');


module.exports = {
  getProfileByName: getProfileByName,
  login: login,
  logoff: logoff,
  registerProfile: registerProfile,
  performSecureAction: performSecureAction
};

var emailRE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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
           return standardError(res, 'CREDENTIALS', 'Vous devez fournir un email et un mot de passe.', next);
    }

    queries.authenticate(email, password, profile => {

        if (profile.status == 4) {
            return standardError(res, 'STATUS_BANNED', 'Compte désactivé', next);
        }
        else if (profile.status == 2) {
            return standardError(res, 'STATUS_PENDING', 'Compte en attente de validation', next);
        }

        security.grantApiAccess(profile.id, req, res, next, (code, error) => standardError(res, code, error, next));
    }, (code, error) => standardError(res, code, error, next));
};

function logoff(req, res, next) {
        if (typeof req.get('apikey') != "undefined") {
            security.clearApiKey(req.get('apikey'));
        }
        req.set('apikey', null);
        res.send({ result : 0 });
        next();
}

function registerProfile(req, res, next) {
    var email = req.params.email;
    var username = req.params.username;
    var password = req.params.password;

    if (typeof email === "undefined") {
           return standardError(res, 'REGISTER_PROFILE_NOMAIL', 'Vous devez fournir une adresse email.' , next);
    }
    if (typeof username === "undefined") {
           return standardError(res, 'REGISTER_PROFILE_NOUSERNAME', 'Vous devez fournir un nom d\'utilisateur.' , next);
    }
    if (typeof password === "undefined") {
           return standardError(res, 'REGISTER_PROFILE_NOPASSWORD', 'Vous devez fournir un mot de passe.' , next);
    }

    if (username.length > 30) {
           return standardError(res, 'REGISTER_PROFILE_USERNAMETOOLONG', 'Nom d\'utilisateur trop long (30 caractères max)' , next);
    }

    if (password.length > 16) {
           return standardError(res, 'REGISTER_PROFILE_PASSWORDTOOLONG', 'Mot de passe trop long (16 caractères max).' , next);
    }

    if (password.length > 16) {
           return standardError(res, 'REGISTER_PROFILE_PASSWORDTOOLONG', 'Mot de passe trop long (16 caractères max).' , next);
    }

    if (!emailRE.test(email.toLowerCase())) {
           return standardError(res, 'REGISTER_PROFILE_EMAILINVALID', 'Adresse e-mail invalide.' , next);
    }

    var newprofile = { name : username, email : email, description : '', status : consts.status.PENDING };
    queries.createProfile(newprofile, password, idprofile => {

        // secure action for profile activation
        var action = { name : 'ACTIVATE_PROFILE', params: {}, profile: idprofile, code: security.createActionCode()};
        queries.createSecureAction(action, () => {
            res.send({ result : 0, profile: newprofile });
    // TODO: ENVOI MAIL
            next();
        } , (errorcode, errormessage) => { standardError(res, errorcode, errormessage, next); });

    }, (errorcode, errormessage) => { standardError(res, errorcode, errormessage, next); });
}

function performSecureAction(req, res, next) {
    var code = req.params.code;

    if (typeof code === "undefined") {
        return standardError(res, 'SECURE_ACTION_NOCODE', 'Un code de sécurité est nécessaire.' , next);
    }

    queries.getPendingSecureActionByCode(code, result => {
        
        switch(result.action) {
            case 'ACTIVATE_PROFILE': 
                queries.updateProfileStatus(result.profile, consts.status.ACTIVE, () => {
                    queries.updateSecureAction(result.id, consts.actionstatus.DONE, () => {
                        security.grantApiAccess(result.profile, req, res, next, (code, error) => standardError(res, code, error, next));
                    }, (errorcode, errormessage) => { standardError(res, errorcode, errormessage, next); });
                }, (errorcode, errormessage) => { standardError(res, errorcode, errormessage, next); });
                break;

            case 'RES_PW_SEC': // TODO
/*
                resetUserPassword(result.username, function(newpass) {
                        var logdata = createBaseLogData(req);
                        logdata.action = 'RES_PW';
                        logdata.data = { player : result.username, password : newpass };
                        storelog(logdata);
                        res.redirect("/gui/passreset_conf.html");
                        return;
                    }, function(error) {
                        res.send(500, "Echec: " + error);
                        return;
                    });
                break;*/
            default:
                return standardError(res, 'SECURE_ACTION_UNKNOWN', 'Action inconnue.' , next);
        }
    }, (errorcode, errormessage) => { standardError(res, errorcode, errormessage, next); });

            
};
