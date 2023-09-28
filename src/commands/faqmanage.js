const {
    SlashCommandBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits,
    AttachmentBuilder
} = require( "discord.js" );
const fs = require( "node:fs" );
const path = require( "node:path" );
const Utils = require( "../utils.js" );
module.exports = {
    disabled: false,
    limited: true,
	data: (
        new SlashCommandBuilder()
        .setName("faqmanage")
        .setDescription("Commands for managing the FAQ")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand((subcommand) => subcommand.setName("add").setDescription("Adds a new FAQ to the FAQs"))
        .addSubcommand((subcommand) => subcommand
            .setName("edit")
            .setDescription("Edits a FAQ by it's tag")
            .addStringOption((option) => option
                .setName("tag")
                .setDescription("The tag of the faq to delete")
                .setRequired(true)
                .setAutocomplete(true)
            ),
        )
        .addSubcommand((subcommand) => subcommand
            .setName("delete")
            .setDescription("Deletes a FAQ by it's tag")
            .addStringOption((option) => option
                .setName("tag")
                .setDescription("The tag of the faq to edit")
                .setRequired(true)
                .setAutocomplete(true)
            ),
        )
        .addSubcommand((subcommand) => subcommand.setName("download").setDescription("Download faqs.json"))
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
            const faqs = JSON.parse(fs.readFileSync(path.join( __dirname, "../data/faqs.json" )));
            const tag = interaction.options.getString( "tag" );
            switch (interaction.options.getSubcommand()) {
                case "add":
                    await interaction.showModal({
                        custom_id: "addFaq",
                        title: "Add new FAQ",
                        components: [
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
			                    .setCustomId("faqTitle")
			                    .setLabel("Title")
                                .setRequired(true)
			                    .setStyle(TextInputStyle.Short)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
			                    .setCustomId("faqTags")
			                    .setLabel("Tags")
                                .setPlaceholder("Input the tags seperated by \",\"")
                                .setRequired(true)
			                    .setStyle(TextInputStyle.Paragraph)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
			                    .setCustomId("faqDescription")
			                    .setLabel("Description")
                                .setPlaceholder("Insert a description for this faq")
                                .setRequired(false)
			                    .setStyle(TextInputStyle.Paragraph)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
			                    .setCustomId("faqImage")
			                    .setLabel("Image")
                                .setPlaceholder("Insert a link")
                                .setRequired(false)
			                    .setStyle(TextInputStyle.Short)
                            ),
                        ],
                    });
                break;
                case "edit":
                    if (!Utils.tagExists(faqs, tag)) {
                        await interaction.reply({ content: `The tag ${tag} was not found!`, ephemeral: true });
                        return;
                    };

                    const foundFaq = faqs.find((f) => f.tags.includes(tag));
                    await interaction.showModal({
                        custom_id: "editFaq",
                        title: foundFaq.title,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
			                    .setCustomId("faqTitle")
			                    .setLabel("Title")
                                .setValue(foundFaq.title)
                                .setRequired(true)
			                    .setStyle(TextInputStyle.Short)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
			                    .setCustomId("faqTags")
			                    .setLabel("Tags")
                                .setPlaceholder("Input the tags seperated by \",\"")
                                .setValue(foundFaq.tags.join( ", " ))
                                .setRequired(true)
			                    .setStyle(TextInputStyle.Paragraph)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
			                    .setCustomId("faqDescription")
			                    .setLabel("Description")
                                .setPlaceholder("Insert a description for this faq")
                                .setValue(foundFaq.description)
                                .setRequired(false)
			                    .setStyle(TextInputStyle.Paragraph)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
			                    .setCustomId("faqImage")
			                    .setLabel("Image")
                                .setPlaceholder("Insert a link")
                                .setValue(foundFaq.image)
                                .setRequired(false)
			                    .setStyle(TextInputStyle.Short)
                            ),
                        ],
                    });
                break;
                case "delete":
                    if (!Utils.tagExists(faqs, tag)) {
                        await interaction.reply({ content: "Could not remove your faq.", ephemeral: true });
                        return;
                    };

                    await interaction.deferReply({});
                    const faq = faqs.find((f) => f.tags.includes(tag));
                    const filtered = faqs.filter((t) => !t.tags.includes(tag));
                    fs.writeFileSync(path.join( __dirname, "../data/faqs.json" ), JSON.stringify(filtered, null, 4));
                    await interaction.editReply({ content: `Removed your faq: \`${faq.title}\`` });
                break;
                case "download":
                    await interaction.deferReply({});
                    const faqsJson = new AttachmentBuilder(
                        Buffer.from(fs.readFileSync(
                            path.join( __dirname, "../data/faqs.json" ), {
                                encoding: "utf-8"
                            })
                        ), { name: "faqs.json" },
                    );
                    
                    await interaction.editReply({ content: "faqs.json", files: [ faqsJson ] });
                break;
            };
        } catch(e) {
            console.log(e);
        };
	},
};