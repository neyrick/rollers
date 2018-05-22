'use strict'

module.exports = {
    status : { ADMIN: 1, PENDING: 2, ACTIVE: 3, BANNED: 4}, 
    actionstatus : { PENDING: 0, DONE: 1},
    SECURE_ACTION_TTL : 3600000,
    roles : { ANY: 0, PLAYER: 1, GM: 2},
    profRelations: { FRIEND: 1}
}
