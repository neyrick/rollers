'use strict'

module.exports = {
    name: 'rollers-api',
    version: '0.0.1',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    db: {
        host: 'localhost', port: 5432, database: 'rollers', user: 'rollers', password: 'rollersp'
    },
	smtp: {
	     service: "Gmail",
	     auth: {
		 user: "blah@gmail.com",
		 pass: "######"
	      }
}
