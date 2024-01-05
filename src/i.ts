import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
} from "discord.js";
import { resetChat } from "./queue";
import { model, visionModel, resolveImages } from "./model";
import { imagine } from "./imagine";
import { music } from "./music";

export async function onInetraction(i: ChatInputCommandInteraction) {
	try {
		switch (i.commandName) {
			case "help":
				await helpCommand(i);
				break;
			case "ping":
				await pingCommand(i);
				break;
			case "clear":
				await clearCommand(i);
				break;
			case "ask":
				await askCommand(i);
				break;
			case "imagine":
				await imagineCommand(i);
				break;
			case "music":
				await musicCommand(i);
				break;
			default:
				await i.reply("不明なコマンドです");
				break;
		}
		return;
	} catch (e) {
		if (i.replied || i.deferred) {
			await i.editReply("エラーが発生しました");
			return;
		}
		await i.reply("エラーが発生しました");
		console.error(e);
	}
}

async function helpCommand(i: ChatInputCommandInteraction) {
	await i.reply({
		embeds: [
			new EmbedBuilder()
				.setColor("Blue")
				.setTitle("ヘルプ")
				.setDescription("チャンネルに`aichat`を含めるとAIチャットになります。"),
		],
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel("サポートサーバー")
					.setURL("https://discord.gg/cyFHD79aw3"),
			),
		],
	});
}

async function pingCommand(i: ChatInputCommandInteraction) {
	const start = Date.now();
	await i.reply("計測中です...");
	await i.editReply(`Pong! \`${Date.now() - start}\`ms`);
}

async function clearCommand(i: ChatInputCommandInteraction) {
	if (
		!i.channel ||
		!("topic" in i.channel) ||
		!i.inGuild() ||
		!i.channel.topic?.includes("aichat")
	) {
		await i.reply(
			"このチャンネルはAIチャットではありません。\nAIチャットにするにはチャンネルトピックに`aichat`を含めてください。",
		);
		return;
	}
	resetChat(i.channelId, i.channel.topic?.includes("unsafe") || false);
	await i.reply("チャットをリセットしました。");
}

async function askCommand(i: ChatInputCommandInteraction) {
	const question = i.options.getString("text", true);
	const attachment = i.options.getAttachment("attachment", false);
	const ephemeral = i.options.getBoolean("ephemeral", false) ?? false;
	let chatFn = model.generateContent.bind(model);
	if (attachment) {
		chatFn = visionModel.generateContent.bind(visionModel);
	}
	const images = await resolveImages(
		attachment
			? [
					{
						url: attachment.url,
						mime: attachment.contentType || "image/png",
					},
			  ]
			: [],
	);
	await i.deferReply({ ephemeral });
	const resText = (await chatFn([question, ...images])).response.text();
	if (resText.length == 0) {
		await i.editReply("AIからの返信がありませんでした");
		return;
	}
	if (resText.length > 2000) {
		await i.editReply({
			content: "長文です",
			files: [{ attachment: Buffer.from(resText), name: "reply.txt" }],
		});
		return;
	}
	await i.editReply(resText);
}

async function imagineCommand(i: ChatInputCommandInteraction) {
	const text = i.options.getString("text", true);
	const negative = i.options.getString("negative", false);
	const size = i.options.getInteger("size", false);
	const count = i.options.getInteger("count", false);
	await i.deferReply();
	const arbuf = await imagine(text, negative || "", size || 512, count || 1);
	const buf = Buffer.from(arbuf);
	await i.editReply({
		files: [{ attachment: buf, name: "imagine.png" }],
	});
}

async function musicCommand(i: ChatInputCommandInteraction) {
	const text = i.options.getString("text", true);
	await i.deferReply();
	const arbuf = await music(text);
	const buf = Buffer.from(arbuf);
	await i.editReply({
		files: [{ attachment: buf, name: "music.wav" }],
	});
}
