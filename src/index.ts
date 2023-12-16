import { Client, GatewayIntentBits, Message } from "discord.js";
import { config } from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { request } from "undici";
config();

const aiChannel = process.env.AI_CHANNEL;
if (!aiChannel) throw new Error("AI_CHANNEL not provided");
const geminiKey = process.env.GEMINI_KEY;
if (!geminiKey) throw new Error("GEMINI_KEY not provided");
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
let chat = model.startChat();

const intents =
	GatewayIntentBits.GuildMessages |
	GatewayIntentBits.Guilds |
	GatewayIntentBits.MessageContent;

const client = new Client({
	intents,
	allowedMentions: {
		parse: [],
		repliedUser: false,
	},
});

client.once("ready", () => {
	console.log("Ready as " + trueClient().user.tag);
});

const geminiQueue: {
	text: string;
	message: Message<true>;
	attachments: { mime: string; url: string }[];
}[] = [];
async function pushQueue(
	message: Message<true>,
	text: string,
	attachments: { mime: string; url: string }[],
) {
	if (geminiQueue.length !== 0) {
		geminiQueue.push({ text, message, attachments });
		return;
	}
	geminiQueue.push({ text, message, attachments });
	while (geminiQueue.length) {
		const { text, message, attachments } = geminiQueue.shift()!;
		let chatFn = chat.sendMessage.bind(chat);
		if (attachments.length) {
			chatFn = visionModel.generateContent.bind(visionModel);
		}
		try {
			await message.channel.sendTyping();
			const images = (
				(
					await Promise.allSettled(
						attachments.map((y) =>
							request(y.url)
								.then((x) => x.body.arrayBuffer())
								.then((buf) => ({
									buf,
									mime: y.mime,
								})),
						),
					)
				).filter((x) => x.status === "fulfilled") as PromiseFulfilledResult<{
					buf: ArrayBuffer;
					mime: string;
				}>[]
			).map((x) => ({
				inlineData: {
					data: Buffer.from(x.value.buf).toString("base64"),
					mimeType: x.value.mime,
				},
			}));
			const res = await chatFn([text, ...images]);
			const resText = res.response.text();
			await message.reply(resText);
		} catch (err: any) {
			if (err.toString().includes("Response was blocked due to SAFETY")) {
				await message.reply("規制対象です。");
			}
			console.error(err);
		}
	}
}

client.on("messageCreate", async (message) => {
	if (
		(!message.content.length && !message.attachments.size) ||
		message.author?.bot
	)
		return;
	if (message.channelId !== aiChannel || !message.inGuild()) return;
	if (message.content.startsWith("#")) return;
	if (message.content.trim() == "clear") {
		chat = model.startChat();
		await message.reply("会話をリセットしました。");
		return;
	}
	await pushQueue(
		message,
		message.content,
		message.attachments
			.filter((x) => x.height)
			.map((x) => ({ url: x.url, mime: x.contentType || "image/png" })),
	);
});

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN not provided");
client.login(token);

function trueClient() {
	return client as Client<true>;
}
