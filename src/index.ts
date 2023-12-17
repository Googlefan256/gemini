import { ActivityType, Client, Events, GatewayIntentBits } from "discord.js";
import { evar } from "./var";
import { pushQueue } from "./queue";
import { onInetraction } from "./i";
import { commands } from "./command";

const client = new Client({
	intents:
		GatewayIntentBits.GuildMessages |
		GatewayIntentBits.Guilds |
		GatewayIntentBits.MessageContent,
	allowedMentions: {
		parse: [],
		repliedUser: false,
	},
});

client.once(Events.ClientReady, async () => {
	if (client.user !== null) {
		console.log("Ready as " + client.user.tag);
		client.user.setActivity({
			name: "AIとお話し中",
			state: "aichatがトピックに含まれてるチャンネルでメッセージを送信",
			type: ActivityType.Custom,
			url: "https://neody.land",
		});
		setInterval(() => {
			client.user?.setActivity({
				name: "AIとお話し中",
				state: "aichatがトピックに含まれてるチャンネルでメッセージを送信",
				type: ActivityType.Custom,
				url: "https://neody.land",
			});
		}, 1000 * 60);
	}
	if (client.application !== null) {
		await client.application.commands.set(commands);
	}
});

client.on(Events.MessageCreate, async (message) => {
	if (
		(!message.content.length && !message.attachments.size) ||
		message.author?.bot
	)
		return;
	if (!("topic" in message.channel) || !message.inGuild()) return;
	if (!message.channel.topic?.includes("aichat")) return;
	const content = message.content.trim();
	if (content.startsWith("#")) return;
	await pushQueue(
		message,
		content,
		message.attachments
			.filter((x) => x.height)
			.map((x) => ({ url: x.url, mime: x.contentType || "image/png" })),
	);
});

client.on(Events.InteractionCreate, async (i) => {
	if (i.isChatInputCommand()) {
		await onInetraction(i);
	}
});

client.login(evar("DISCORD_TOKEN"));
