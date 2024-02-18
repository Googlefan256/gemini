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
		.addStringOption((x) =>
			x
				.setName("model")
				.setDescription("モデルを指定します")
				.setRequired(false)
				.addChoices(
					{ name: "Gemini", value: "gemini-pro" },
					{ name: "Swallow", value: "swallow" },
				),
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
		.addIntegerOption((x) =>
			x
				.setName("count")
				.setDescription("生成する画像の数")
				.setRequired(false)
				.setMaxValue(16)
				.setMinValue(1),
		)
		.addStringOption((x) =>
			x
				.setName("positive")
				.setDescription("生成する画像の内容")
				.setRequired(true),
		)
		.addStringOption((x) =>
			x
				.setName("negative")
				.setDescription("生成しない画像の内容")
				.setRequired(false),
		)
		.addIntegerOption((x) =>
			x
				.setName("size")
				.setDescription("生成する画像のサイズ")
				.setRequired(false)
				.setMinValue(64)
				.setMaxValue(4096),
		),
];
