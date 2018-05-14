
const config  = require('./config');
const consts = require('./consts');
const security = require('./security');
var pgp = require('pg-promise')({});
var connectionString = 'postgres://localhost:5432/puppies';
var db = pgp(config.db);

// add query functions

module.exports = {
    getProfileByName: getProfileByName,         
    authenticate: authenticate,
    deleteOldKey: deleteOldKey,
    createKey: createKey
//    getProfileById: getProfileById
};

function standardDbError(err, errorFunction) {
    console.log("Erreur technique sur la base: " + JSON.stringify(err));
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
        
        db.one('INSERT INTO profile (name, description, email, status) VALUES ( ${name}, ${description}, ${email}, ${status})' , { name: inProfile.name, email: inProfile.email, description: inProfile.description, status: consts.status.PENDING})      
        .then(data => {
            var newId = data.id;
            db.none('INSERT INTO creds (profile, passwd) VALUES ( ${profile}, ${passwd})' , { profile: data.id, passwd: security.hashPassword(password)})      
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
                        callback(inProfile);
                    })
                  .catch(err => { standardDbError(err, error) });
            })
    .catch(err => { standardDbError(err, error) });
};

function updateProfile(inProfile, inPassword, callback, error) {

    db.none('UPDATE profile SET name = ${name}, description = ${description}, email = ${email}, status = ${status} WHERE id = ${id}', { name: inProfile.name, email: inProfile.email, description: inProfile.description, status: inProfile.status, id: inProfile.id})
        .then(callback)
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

function deleteProfile(id, callback, error) {
        db.none('DELETE FROM profile WHERE id = ${id} CASCADE', {id: id})
        .then(callback)
        .catch(err => { standardDbError(err, error) });
}

function updatePassword(id, oldpassword, newpassword, callback, error) {
    db.result('UPDATE creds SET passwd = ${newpassword} WHERE profile = ${id} AND passwd = ${oldpassword}', { id: inProfile.id, oldpassword : security.hashPassword(oldpassword), newpassword: security.hashPassword(newpassword)})
        .then( result => {
            if (result.rowCount == 1) { callback(); }
            else { error('UNKNOWN', 'Utilisateur introuvable ou ancien mot de passe incorrect') }
        })
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
    db.any('SELECT pr.* FROM profile pr JOIN creds ON pr.id = creds.profile WHERE pr.email = ${email} AND creds.password = ${password}', {email: email, password: security.hashPassword(password)})
        .then( result => {
            if (result.length == 0) { error('AUTHENT', 'Utilisateur introuvable ou mot de passe incorrect'); }
            else if (result.length == 1) { callback(result[0]); }
// TODO: envoi mail
            else { standardDbError(result, error) }
        })
    .catch(err => {  console.log('ERROR:', err); standardDbError(err, error) });
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



