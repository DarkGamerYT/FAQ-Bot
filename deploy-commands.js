const { REST, Routes } = require( "discord.js" );
const fs = require( "node:fs" );
const path = require( "node:path" );
const config = require( "./config.json" );
require( "dotenv" ).config();

const commands = [];
const limitedCommands = [];
const foldersPath = path.join( __dirname, "/src/commands" );
const commandFolders = fs.readdirSync( foldersPath );
for (const folder of commandFolders) {
	const commandsPath = path.join( foldersPath, folder );
	const command = require( commandsPath );
	if (
        "data" in command
        && "execute" in command
    ) {
		if(!command.disabled) {
			(command.limited ? limitedCommands : commands).push(command.data.toJSON());
		};
	} else console.log(
        "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[WARNING] \x1B[0m- The command at " + filePath + " is missing a required \"data\" or \"execute\" property."
    );
};

const rest = new REST().setToken( process.env.token );
(async () => {
	try {
		console.log(
			"\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[INFO] \x1B[0m- Started refreshing " + commands.length + " application (/) commands."
		);

		for await (const guild of config.manage_servers) {
			await rest.put(Routes.applicationGuildCommands("1155218723897081946", guild), {
				body: limitedCommands,
			}).catch(() => {});
		};

		await rest.put(Routes.applicationCommands( "1155218723897081946" ), { body: commands });
		console.log(
			"\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[INFO] \x1B[0m- Successfully reloaded " + commands.length + " application (/) commands."
		);
	} catch (error) {
		console.error(error);
	};
})();