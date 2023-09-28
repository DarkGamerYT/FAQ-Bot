const { Events, Client } = require( "discord.js" );
module.exports = {
	name: Events.ClientReady,
	once: true,

    /** @param { Client } client */
	execute( client ) {
		console.log(
            "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[INFO] \x1B[0m- Logged in as: " + client.user.tag
        );
	},
};