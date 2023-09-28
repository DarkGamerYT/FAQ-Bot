require( "dotenv" ).config();
const { Client, GatewayIntentBits, Events } = require( "discord.js" );
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});
const fs = require( "node:fs" );
const path = require("node:path");
if (!fs.existsSync(path.join(__dirname, "src/data"))) fs.mkdirSync(path.join(__dirname, "src/data/"));
if (!fs.existsSync(path.join(__dirname, "src/data/faqs.json"))) {
    fs.writeFileSync(path.join(__dirname, "src/data/faqs.json"), JSON.stringify([]));
    console.log(
        "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[INFO] \x1B[0m- faqs.json not found! creating a new one."
    );
};

new (require( "./src/classes/InteractionRegisterer.js" ))(client);
new (require( "./src/classes/EventHandler.js" ))(client);

client.login( process.env.token );