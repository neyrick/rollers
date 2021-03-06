
const config  = require('./config');
const consts = require('./consts');
const security = require('./security');
const moment = require( 'moment' );

var pgp = require('pg-promise')({});
var types = pgp.pg.types;
types.setTypeParser(1114, str => moment.utc(str).format());

var connectionString = 'postgres://localhost:5432/puppies';
var db = pgp(config.db);

const playerColumnSet = new pgp.helpers.ColumnSet(['setting', 'profile', 'role'], {table: {table: 'player'}});

// add query functions

module.exports = {
    getProfileByName: getProfileByName,         

    authenticate: authenticate,
    deleteOldKey: deleteOldKey,
    createKey: createKey,
    loadAllKeys: loadAllKeys,

    createProfile: createProfile,
    updateProfileStatus: updateProfileStatus,
    updateProfileDescription: updateProfileDescription,
    updateProfileUsername: updateProfileUsername,
    updateProfileEmail: updateProfileEmail,
    updateProfilePassword: updateProfilePassword,
    checkEmail: checkEmail,
    updateRoles: updateRoles,

    createSecureAction : createSecureAction,
    getPendingSecureActionByCode : getPendingSecureActionByCode,
    updateSecureAction : updateSecureAction,

    addProfileRelationByName: addProfileRelationByName,
    deleteProfileRelationByName: deleteProfileRelationByName
};

function standardDbError(err, errorFunction) {
    var message = err;
    if (typeof err === "object") {
        message = JSON.stringify(err);
    }
    console.log("Erreur technique sur la base: " + message);
    console.trace();
    errorFunction('TECH', 'Erreur Technique');
}

// PROFILE MANAGEMENT

function getProfileByName(name, callback, error) {
  db.one('select name, description, status from profile pr LEFT JOIN player pl ON pr.id=pl.profile where pr.name = ${name}', { name: name } )
    .then(callback)
    .catch(err => { standardDbError(err, error) });
}

function getProfileById(id, callback, error) {
  db.one('select name, description, status from profile pr LEFT JOIN player pl ON pr.id=pl.profile where pr.id = ${id}', { id: id } )
    .then(callback)
    .catch(err => { standardDbError(err, error) });
}

function createProfile(inProfile, inPassword, callback, error) {

        var password = security.genPassword();            
        
        db.one('INSERT INTO profile (name, description, email, status) VALUES ( ${name}, ${description}, ${email}, ${status}) RETURNING id' , { name: inProfile.name, email: inProfile.email, description: inProfile.description, status: inProfile.status})      
        .then(data => {
            var newId = data.id;
            db.none('INSERT INTO creds (profile, password) VALUES ( ${profile}, ${passwd})' , { profile: data.id, passwd: security.hashPassword(password)})      
                    .then(() => {
/*
            TODO: LOGGING 
            var logdata = createBaseLogData(req);
            logdata.data = newuser;
            logdata.action = 'ADMIN_CREATE_USER';
            storelog(logdata);            

            logdata = createBaseLogData(req);
            logdata.action = 'RES_PW';
            logdata.data = { player : savedPlayer.name, password : newpass };
            storelog(logdata);            
*/
                        callback(newId);
                    })
                  .catch(err => { standardDbError(err, error) });
            })
    .catch(err => { 
        if (err.code == 23505) {
            error('REGISTER_PROFILE_CONFLICT', 'Adresse email ou nom d\'utilisateur déjà pris.');
        }
        else {
            standardDbError(err, error);
        }
    });
};

function updateRoles(idprofile, roles, callback, error) {

    db.none('DELETE FROM player WHERE profile = ${idprofile}', {idprofile: idprofile})
        .then(() => { if (roles.length > 0) {
             roles.forEach( role => role.profile = idprofile);
             const insertRoles = pgp.helpers.insert(roles, playerColumnSet);
             db.none(insertRoles).then(callback)
            .catch(err => { standardDbError(err, error) });     
        }
        else {
            callback()
        }})
        .catch(err => { standardDbError(err, error) });     
/*
            TODO: LOGGING 
            var logdata = createBaseLogData(req);
            logdata.data = newuser;
            logdata.action = 'ADMIN_CREATE_USER';
            storelog(logdata);            

            logdata = createBaseLogData(req);
            logdata.action = 'RES_PW';
            logdata.data = { player : savedPlayer.name, password : newpass };
            storelog(logdata);            
*/

};

function checkEmail(email, callback, error) {
    db.one('SELECT count(*) AS rescount FROM profile WHERE email = ${email}', { email: email})
        .then( result => {
//            console.log('result: ' + JSON.stringify(result));
            if (result.rescount != 0) { error('UPDATE_PROFILE_EMAIL_CONFLICT', 'Adresse e-mail déjà utilisée.'); }
            else callback();
        })
        .catch(err => { standardDbError(err, error) });
}

function updateProfileEmail(idprofile, email, callback, error) {
    db.none('UPDATE profile SET email = ${email} WHERE id = ${id}', { email: email, id: idprofile})
            .then(callback)
       .catch(err => {
            if (err.code == 23505) {
                error('UPDATE_PROFILE_EMAIL_CONFLICT', 'Adresse e-mail déjà utilisée.');
            }
            else {
                standardDbError(err, error);
            }
        });
}

function updateProfileUsername(idprofile, username, callback, error) {
    db.none('UPDATE profile SET name = ${username} WHERE id = ${id}', { username: username, id: idprofile})
            .then(callback)
       .catch(err => {
            if (err.code == 23505) {
                error('UPDATE_PROFILE_USERNAME_CONFLICT', 'Nom d\'utilisateur déjà pris.');
            }
            else {
                standardDbError(err, error);
            }
        });
}


function updateProfilePassword(id, oldpassword, newpassword, callback, error) {
    db.result('UPDATE creds SET passwd = ${newpassword} WHERE profile = ${id} AND passwd = ${oldpassword}', { id: inProfile.id, oldpassword : security.hashPassword(oldpassword), newpassword: security.hashPassword(newpassword)})
        .then( result => {
            if (result.rowCount == 1) { callback(); }
            else { error('UNKNOWN', 'Utilisateur introuvable ou ancien mot de passe incorrect') }
        })
        .catch(err => { standardDbError(err, error) });
}


function updateProfileStatus(idprofile, status, callback, error) {
    db.none('UPDATE profile SET status = ${status} WHERE id = ${id}', { status: status, id: idprofile})
            .then(callback)
           .catch(err => { standardDbError(err, error) });
}

function updateProfileDescription(idprofile, description, callback, error) {
    db.none('UPDATE profile SET description = ${description} WHERE id = ${id}', { description: description, id: idprofile})
            .then(callback)
           .catch(err => { standardDbError(err, error) });
}

function deleteProfile(id, callback, error) {
        db.none('DELETE FROM profile WHERE id = ${id} CASCADE', {id: id})
        .then(callback)
        .catch(err => { standardDbError(err, error) });
}

function resetPassword(id, callback, error) {
    var password = security.genPassword();     
    db.result('UPDATE creds SET passwd = ${newpassword} WHERE profile = ${id}', { id: inProfile.id, newpassword: security.hashPassword(password)})
        .then( result => {
            if (result.rowCount == 1) { callback(); }
// TODO: envoi mail
            else { error('UNKNOWN', 'Utilisateur introuvable') }
        })
    .catch(err => { standardDbError(err, error) });
}

function authenticate(email, password, callback, error) {
    db.any('SELECT pr.* FROM profile pr JOIN creds ON pr.id = creds.profile WHERE pr.email = ${email} AND creds.password = ${password}', {email: email, password: password})
        .then( result => {
            if (result.length == 0) { error('AUTHENT', 'Utilisateur introuvable ou mot de passe incorrect'); }
            else if (result.length == 1) { callback(result[0]); }
// TODO: envoi mail
            else { standardDbError(result, error) }
        })
    .catch(err => {  standardDbError(err, error) });
}

function deleteOldKey(apikey, callback, error) {
    db.any('DELETE FROM apikey WHERE key = ${key}', { key: apikey})
        .then( callback(profile))
    .catch(err => { standardDbError(err, error) });
}

function deleteAllKeys(idprofile, callback, error) {
    db.any('DELETE FROM apikey WHERE idprofile = ${idprofile}', { idprofile: idprofile})
        .then( callback())
    .catch(err => { standardDbError(err, error) });
}

function createKey(idprofile, apikey, callback, error) {
    db.none('INSERT INTO apikey (key, idprofile) VALUES ( ${key}, ${idprofile})', { key: apikey, idprofile: idprofile})
        .then( callback())
    .catch(err => { standardDbError(err, error) });
}

function loadAllKeys(callback, error) {
    db.any('SELECT key, idprofile FROM apikey').
        then( callback).catch(error);
}

function createSecureAction(action, callback, error) {
    db.none('INSERT INTO secure_action ( action, params, profile, code ) VALUES ( ${action}, ${params}, ${profile}, ${code})', { action: action.name, params: JSON.stringify(action.params), profile: action.profile, code: action.code})
        .then( callback())
    .catch(err => { standardDbError(err, error) });
}

function getPendingSecureActionByCode(code, callback, error) {
    db.any('SELECT EXTRACT(EPOCH FROM created) * 1000 AS age, * FROM secure_action WHERE code = ${code}', {code : code})
        .then( result => {
            if (result.length == 0) { error('SECURE_ACTION_UNKNOWN', 'Impossible d\'identifier l\'action à effectuer'); }
            else if (result.length == 1) {
//                    console.log('age: ' + result[0].age);
//                    console.log('now: ' + new Date().valueOf());
//                    console.log('res: ' + (new Date().valueOf() - consts.SECURE_ACTION_TTL));
                if (result[0].status != consts.actionstatus.PENDING) {
                    return error('SECURE_ACTION_DONE', 'Action déjà effectuée');
                }
                else if (result[0].age < (new Date().valueOf() - consts.SECURE_ACTION_TTL)) {
                    return error('SECURE_ACTION_OBSOLETE', 'Cette action a expiré.');
                }
                else {
                    console.log('Performing action ' + result[0].id);
                    callback(result[0]);
                }
            }
            else { standardDbError(result, error) }
        })
    .catch(err => { console.log('Err: ' + err); standardDbError(err, error) });
}

function updateSecureAction(id, status, callback, error) {
    db.none('UPDATE secure_action SET status = ${status} WHERE id = ${id}', { status: status, id: id})
    .then(callback)
    .catch(err => { standardDbError(err, error) });
}

function addProfileRelationByName(idUser, targetname, reltype, callback, error) {
    db.none('INSERT INTO profile_rels ( prof1, prof2, reltype ) VALUES ( ${prof1}, (select id from profile where name = ${targetname}), ${reltype})', { prof1: idUser, targetname: targetname, reltype: reltype})
        .then( callback())
    .catch(err => { standardDbError(err, error) });

}

function deleteProfileRelationByName(idprofile, targetName, reltype, callback, error) {
    db.any('DELETE FROM profile_rels WHERE prof1=${prof1} AND prof2=(select id from profile where name = ${targetname}) AND reltype=${reltype}', { prof1: idUser, targetname: targetname, reltype: reltype})
        .then( callback())
    .catch(err => { standardDbError(err, error) });
}


