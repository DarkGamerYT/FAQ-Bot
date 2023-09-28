const { Events, Colors } = require( "discord.js" );
const MiniSearch = require( "minisearch" );
const fs = require( "node:fs" );
const path = require( "node:path" );
const Utils = require( "../utils.js" );
module.exports = {
	name: Events.MessageCreate,
	once: false,

    /**
	 * @param { import("discord.js").Client } client
	 * @param { import("discord.js").Message } message
	 */
	async execute( client, message ) {
		if (message.author.id == client.user.id) return;
		if (!message.content.startsWith("?")) return;
		const content = message.content.slice(1).toLowerCase();
		try {
			const miniSearch = new MiniSearch({
				fields: [ "title", "tag" ],
				boost: { tag: 3, title: 1 }
			});

			const faqs = JSON.parse(fs.readFileSync(path.join( __dirname, "../data/faqs.json" )));
			const all = Utils.getAllTags().map((tag, index) => {
				const t = faqs.find((f) => f.tags.includes(tag));
				return {
					id: index,
					title: t.title,
					tag,
				};
			});

			miniSearch.addAll(all);
			const result = miniSearch.search( content )[0];
			if (!result) return;
			
			const tag = all.find((a) => a.id == result.id).tag;
            const faq = faqs.find((faq) => faq.tags.includes(tag));
            if (!faq) return;

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

            const msg = await message.channel.send({ embeds: [ embed ] });
			await msg.react("🚫");
			const collector = msg.createReactionCollector({
				filter: (reaction, user) => (
					reaction.emoji.name == "🚫"
					&& user.id == message.author.id
				), time: 10 * 1000
			});

			collector.on("collect", () => msg.delete());
			collector.on("end", (collected, reason) => {
				if (reason != "messageDelete") {
					const reaction = msg.reactions.resolve("🚫");
					reaction.users.remove(client.user.id);
				};
			});
		} catch {};
	},
};