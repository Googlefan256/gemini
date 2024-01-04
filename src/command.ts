import { SlashCommandBuilder } from "discord.js";

export const commands = [
	new SlashCommandBuilder()
		.setName("help")
		.setDescription("ヘルプを表示します"),
	new SlashCommandBuilder().setName("ping").setDescription("Pong!"),
	new SlashCommandBuilder()
		.setName("clear")
		.setDescription("AIチャットをリセットします"),
	new SlashCommandBuilder()
		.setName("ask")
		.setDescription("AIに質問します")
		.addStringOption((x) =>
			x.setName("text").setDescription("質問する内容").setRequired(true),
		)
		.addAttachmentOption((x) =>
			x.setName("attachment").setDescription("質問する画像").setRequired(false),
		)
		.addBooleanOption((x) =>
			x
				.setName("ephemeral")
				.setDescription("あなたにしか見えなくします")
				.setRequired(false),
		),
	new SlashCommandBuilder()
		.setName("imagine")
		.setDescription("画像を生成します")
		.addStringOption((x) =>
			x.setName("text").setDescription("テキスト").setRequired(true),
		)
		.addStringOption((x) =>
			x.setName("negative").setDescription("ネガティブ").setRequired(false),
		),
	new SlashCommandBuilder()
		.setName("music")
		.setDescription("音楽を生成します")
		.addStringOption((x) =>
			x.setName("text").setDescription("テキスト").setRequired(true),
		),
];
