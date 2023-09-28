const { Collection } = require( "discord.js" );
const path = require( "node:path" );
const fs = require( "node:fs" );
module.exports = class {
    constructor( client ) {
        client.commands = new Collection();
        client.modals = new Collection();

        const commandsPath = path.join( __dirname, "../commands" );
        const commandFiles = fs.readdirSync( commandsPath ).filter((file) => file.endsWith( ".js" ));
        for (const file of commandFiles) {
            const filePath = path.join( commandsPath, file );
            const command = require( filePath );
            if (
                "data" in command
                && "execute" in command
            ) client.commands.set( command.data.name, command );
            else console.log(
                "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[WARNING] \x1B[0m- The command at " + filePath + " is missing a required \"data\" or \"execute\" property."
            );
        };

        const modalsPath = path.join( __dirname, "../modals" );
        const modalFiles = fs.readdirSync( modalsPath ).filter((file) => file.endsWith( ".js" ));
        for (const file of modalFiles) {
            const filePath = path.join( modalsPath, file );
            const modal = require( filePath );
            if (
                "data" in modal
                && "execute" in modal
            ) client.modals.set( modal.data.data.custom_id, modal );
            else console.log(
                "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[WARNING] \x1B[0m- The modal at " + filePath + " is missing a required \"data\" or \"execute\" property."
            );
        };
    };
};