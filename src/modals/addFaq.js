const { ModalBuilder, Colors } = require( "discord.js" );
const fs = require( "node:fs" );
const path = require( "node:path" );
const Utils = require( "../utils.js" );
module.exports = {
	data: (
        new ModalBuilder()
        .setCustomId("addFaq")
    ),
    /**
     * @param { import("discord.js").Client } client
     * @param { import("discord.js").Interaction } interaction
     */
	execute: async ( client, interaction ) => {
        try {
            const faqTitle = interaction.fields.getTextInputValue("faqTitle");
	        const faqTags = interaction.fields.getTextInputValue("faqTags").toLowerCase().replaceAll(" ", "").split(",");
	        const faqDescription = interaction.fields.getTextInputValue("faqDescription");
	        const faqImage = interaction.fields.getTextInputValue("faqImage");

            const faqs = JSON.parse(fs.readFileSync(path.join( __dirname, "../data/faqs.json" )));
            const faqEntry = {
                title: faqTitle,
                description: faqDescription,
                tags: faqTags,
                image: faqImage,
                last_updated: parseInt(new Date() / 1000),
            };

            if (Utils.tagsExist(faqs, faqTags)) {
                const embed = createEmbed("Could not add FAQ", false, faqEntry);
                await interaction.reply({ embeds: [ embed ] });
            } else {
                faqs.push(faqEntry);
                fs.writeFileSync(path.join( __dirname, "../data/faqs.json" ), JSON.stringify(faqs, null, 4));
                
                const embed = createEmbed("Added new FAQ", true, faqEntry);
                await interaction.reply({ embeds: [ embed ] });
            };
        } catch(e) { console.log(e); };
	},
};

const createEmbed = (title, success, entry) => {
    return {
        title,
        author: { name: success ? "Success!" : "Error!" },
        thumbnail: { url: entry?.url ? entry.url : null },
        description: success ? "" : "At least one of your tags does already exist.",
        color: success ? Colors.Green : Colors.Red,
        fields: [
            { name: "Title", value: entry.title, inline: false },
            { name: "Tags", value: entry.tags.join(", "), inline: false },
            { name: "Description", value: (entry?.description?.length > 0 ? entry.description : "*not given*"), inline: false },
            { name: "Image-URL", value: (entry?.image?.length > 0 ? entry.image : "*not given*"), inline: true },
        ],
        footer: { text: "Last Updated" },
        timestamp: new Date(entry.last_updated * 1000),
    };
};