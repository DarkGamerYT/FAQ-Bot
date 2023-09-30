const { SlashCommandBuilder, Colors, ComponentType } = require( "discord.js" );
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
                        thumbnail: { url: faq?.image },
                        color: Colors.Blurple, //parseInt(faq?.color ?? "000000", 16),
                        footer: { text: null },
                        timestamp: null,
                    };

                    if (faq.last_updated) {
                        embed.footer.text = "Last Updated";
                        embed.timestamp = new Date(faq.last_updated * 1000);
                    };
                    
                    let msg = await interaction.editReply({ embeds: [ embed ] });
                    await msg.react( "🚫" );
                    const collector = msg.createReactionCollector({
                        filter: (reaction, user) => (
                            reaction.emoji.name == "🚫"
                            && user.id == interaction.user.id
                        ), time: 10 * 1000
                    });
                    

                    collector.on("collect", () => msg.delete());
                    collector.on("end", (collected, reason) => {
                        if (reason != "messageDelete") {
                            const reaction = msg.reactions.resolve( "🚫" );
                            reaction.users.remove(client.user.id);
                        };
                    });
                break;
                case "list":
                    let page = interaction.options.getNumber( "page" ) ?? 1;
                    let AMOUNT = 20;
                    const range = Utils.range(Math.ceil(Utils.getAllTags().length / AMOUNT));
                    if (!range[page]) page = 1;

                    const pageTags = Utils.getPageTags(AMOUNT, page - 1);
                    const buttons = [
                        { type: 2, style: 2, custom_id: "firstPage", label: "<<" },
                        { type: 2, style: 2, custom_id: "previousPage", label: "<" },
                        { type: 2, style: 2, disabled: true, custom_id: "pageCount", label: (page + "/" + range.length) },
                        { type: 2, style: 2, custom_id: "nextPage", label: ">" },
                        { type: 2, style: 2, custom_id: "lastPage", label: ">>" },
                    ];

                    switch (page) {
                        case 1:
                            buttons[0].disabled = true;
                            buttons[1].disabled = true;
                            buttons[3].disabled = false;
                            buttons[4].disabled = false;
                        break;
                        case range.length:
                            buttons[0].disabled = false;
                            buttons[1].disabled = false;
                            buttons[3].disabled = true;
                            buttons[4].disabled = true;
                        break;
                        default:
                            buttons[0].disabled = false;
                            buttons[1].disabled = false;
                            buttons[3].disabled = false;
                            buttons[4].disabled = false;
                        break;
                    };
                    
                    let listMsg = await interaction.editReply({
                        embeds: [
                            {
                                title: "All FAQ Tags",
                                fields: [
                                    {
                                        name: "Tags",
                                        value: "```\n" + pageTags.join("\n") + "```"
                                    },
                                ],
                                color: Colors.Blurple,
                                timestamp: null,
                            },
                        ],
                        components: [{ type: 1, components: buttons }],
                    });

                    const listCollector = listMsg.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        filter: (component) => (component.user.id == interaction.user.id),
                        time: 60 * 1000,
                    });

                    listCollector.on("collect", (component) => {
                        listCollector.resetTimer();
                        component.deferUpdate();
                        switch (component.customId) {
                            case "firstPage": page = 1; break;
                            case "previousPage": page--; break;
                            case "nextPage": page++; break;
                            case "lastPage": page = range.length; break;
                        };

                        const pageTags = Utils.getPageTags(AMOUNT, page - 1);
                        buttons[2].label = (page + "/" + range.length);
                        switch (page) {
                            case 1:
                                buttons[0].disabled = true;
                                buttons[1].disabled = true;
                                buttons[3].disabled = false;
                                buttons[4].disabled = false;
                            break;
                            case range.length:
                                buttons[0].disabled = false;
                                buttons[1].disabled = false;
                                buttons[3].disabled = true;
                                buttons[4].disabled = true;
                            break;
                            default:
                                buttons[0].disabled = false;
                                buttons[1].disabled = false;
                                buttons[3].disabled = false;
                                buttons[4].disabled = false;
                            break;
                        };

                        interaction.editReply({
                            embeds: [
                                {
                                    title: "All FAQ Tags",
                                    fields: [
                                        {
                                            name: "Tags",
                                            value: "```\n" + pageTags.join("\n") + "```"
                                        },
                                    ],
                                    color: Colors.Blurple,
                                    timestamp: null,
                                },
                            ],
                            components: [{ type: 1, components: buttons }],
                        });
                    });

                    listCollector.on("end", (collected, reason) => {
                        if (reason == "messageDelete") return;
                        const pageTags = Utils.getPageTags(AMOUNT, page - 1);
                        buttons[2].label = (page + "/" + range.length);
                        buttons[0].disabled = true;
                        buttons[1].disabled = true;
                        buttons[3].disabled = true;
                        buttons[4].disabled = true;
                        interaction.editReply({
                            embeds: [
                                {
                                    title: "All FAQ Tags",
                                    fields: [
                                        {
                                            name: "Tags",
                                            value: "```\n" + pageTags.join("\n") + "```"
                                        },
                                    ],
                                    color: Colors.Blurple,
                                    timestamp: null,
                                },
                            ],
                            components: [{ type: 1, components: buttons }],
                        });
                    });
                break;
            };
        } catch(e) { console.log(e); };
	},
};