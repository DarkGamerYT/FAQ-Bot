const { SlashCommandBuilder, Colors } = require( "discord.js" );
const fs = require( "node:fs" );
const path = require( "node:path" );
const Utils = require( "../utils.js" );
module.exports = {
    disabled: false,
	data: (
        new SlashCommandBuilder()
        .setName("faq")
        .setDescription("Commands for accessing the FAQ")
        .addSubcommand((subcommand) => subcommand
            .setName("get")
            .setDescription("No description provided")
            .addStringOption((option) => option
                .setName("tag")
                .setDescription("No description provided")
                .setRequired(true)
                .setAutocomplete(true)
            ),
        ).addSubcommand((subcommand) => subcommand
            .setName("list")
            .setDescription("Get a list of all FAQ-Tags")
            .addNumberOption((option) => option.setName("page").setDescription("No description provided")),
        )
    ),
    /**
     * @param { import("discord.js").Client } client
     * @param { import("discord.js").Interaction } interaction
     */
    autocomplete: async ( client, interaction ) => {
        const focusedValue = interaction.options.getFocused();
        const options = Utils.getAllTags()
        .filter((c) => c.startsWith(focusedValue))
        .sort().filter((_, index) => index < 25);

        await interaction.respond(
            options
            .map((tag) => ({ name: tag, value: tag }))
        );
    },
    /**
     * @param { import("discord.js").Client } client
     * @param { import("discord.js").Interaction } interaction
     */
	execute: async ( client, interaction ) => {
        try {
            await interaction.deferReply({});
            switch (interaction.options.getSubcommand()) {
                case "get":
                    const tag = interaction.options.getString( "tag" );
                    const faqs = JSON.parse(fs.readFileSync(path.join( __dirname, "../data/faqs.json" )));
                    const faq = faqs.find((faq) => faq.tags.includes(tag));
                    if (!faq) {
                        await interaction.editReply({
                            embeds: [
                                {
                                    title: "Tag not found",
                                    description: "Could not find your tag. If you made a typo, use the autocomplete feature to find the correct tag!",
                                    color: Colors.Red,
                                },
                            ],
                        });

                        return;
                    };

                    const embed = {
                        title: faq.title,
                        description: faq?.description,
                        image: { url: faq?.image },
                        color: Colors.Blurple, //parseInt(faq?.color ?? "000000", 16),
                        footer: { text: null },
                        timestamp: null,
                    };

                    if (faq.last_updated) {
                        embed.footer.text = "Last Updated";
                        embed.timestamp = new Date(faq.last_updated * 1000);
                    };

                    const msg = await interaction.editReply({ embeds: [ embed ] });
                    await msg.react("🚫");
                    const collector = msg.createReactionCollector({
                        filter: (reaction, user) => (
                            reaction.emoji.name == "🚫"
                            && user.id == interaction.user.id
                        ), time: 10 * 1000
                    });

                    collector.on("collect", () => msg.delete());
                    collector.on("end", (collected, reason) => {
                        if (reason != "messageDelete") {
                            const reaction = msg.reactions.resolve("🚫");
                            reaction.users.remove(client.user.id);
                        };
                    });
                break;
                case "list":
                    const page = interaction.options.getNumber( "page" ) ?? 1;
                    await interaction.editReply({ content: "Page: " + page });
                break;
            };
        } catch(e) {
            console.log(e);
        };
	},
};