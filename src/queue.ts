import { ChatSession } from "@google/generative-ai";
import { Collection, Message } from "discord.js";
import {
	model,
	modelZero,
	resolveImages,
	visionModel,
	visionModelZero,
} from "./model";

const geminiQueues = new Collection<
	string,
	{
		chat: ChatSession;
		messages: {
			text: string;
			message: Message<true>;
			attachments: { mime: string; url: string }[];
		}[];
	}
>();

export function resetChat(channelId: string, unsafe: boolean) {
	if (geminiQueues.has(channelId)) {
		const q = geminiQueues.get(channelId)!;
		q.chat = unsafe ? modelZero.startChat() : model.startChat();
		geminiQueues.set(channelId, q);
	}
}

export async function pushQueue(
	message: Message<true>,
	text: string,
	attachments: { mime: string; url: string }[],
	unsafe: boolean,
) {
	if (!geminiQueues.has(message.channelId)) {
		geminiQueues.set(message.channelId, {
			chat: unsafe ? modelZero.startChat() : model.startChat(),
			messages: [],
		});
	}
	const { chat, messages: geminiQueue } = geminiQueues.get(message.channelId)!;
	if (geminiQueue.length !== 0) {
		geminiQueue.push({ text, message, attachments });
		return;
	}
	geminiQueue.push({ text, message, attachments });
	while (geminiQueue.length) {
		const { text, message, attachments } = geminiQueue.shift()!;
		let chatFn = chat.sendMessageStream.bind(chat);
		if (attachments.length) {
			chatFn = unsafe
				? visionModelZero.generateContentStream.bind(visionModelZero)
				: visionModel.generateContentStream.bind(visionModel);
		}
		try {
			const images = await resolveImages(attachments);
			const msg = await message.reply("AIが考え中です...");
			const result = await chatFn([text, ...images]);
			let resText = "";
			for await (const chunk of result.stream) {
				const chunkText = chunk.text();
				resText += chunkText;
				if (resText.length <= 2000 && resText.length > 0) {
					await msg.edit(resText);
				}
			}
			if (resText.length == 0) {
				await msg.edit("AIからの返信がありませんでした");
				continue;
			}
			if (resText.length > 2000) {
				await msg.edit({
					content: "長文です",
					files: [{ attachment: Buffer.from(resText), name: "reply.txt" }],
				});
				continue;
			}
		} catch (err: any) {
			if (err.toString().includes("SAFETY")) {
				await message.reply("規制対象です。");
				continue;
			}
			if (err.toString().includes("OTHER")) {
				await message.reply("その他の理由により返信できません");
				continue;
			}
			if (err.toString().includes("BLOCKED_REASON_UNSPECIFIED")) {
				await message.reply("不明な理由によりブロックされました");
				continue;
			}
			if (err.toString().includes("RECITATION")) {
				await message.reply("朗読を検知しました???");
				continue;
			}
			console.error(err);
			try {
				await message.reply("その他のエラーが発生しました");
			} catch {}
		}
	}
}
