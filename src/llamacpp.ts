import { Message } from "discord.js";
import { evar } from "./var";

const endpoint = evar("LLAMA_CPP_ENDPOINT");

const SYSTEM_PROMPT =
	"これはユーザーと親切で協力的で正確なアシスタントの間の会話です。";

export class LLamaCppChat {
	history: { user: string; message: string }[] = [];
	constructor() {}
	async chat(message: string): Promise<string> {
		this.history.push({ user: "user", message });
		try {
			const res = await fetch(endpoint, {
				method: "POST",
				body: JSON.stringify({
					stream: false,
					n_predict: 400,
					temperature: 0.7,
					stop: ["</s>", "Bot:", "User:"],
					repeat_last_n: 256,
					repeat_penalty: 1.18,
					top_k: 40,
					top_p: 0.95,
					tfs_z: 1,
					typical_p: 1,
					presence_penalty: 0,
					frequency_penalty: 0,
					mirostat: 0,
					mirostat_tau: 5,
					mirostat_eta: 0.1,
					grammar: "",
					n_probs: 0,
					image_data: [],
					cache_prompt: true,
					api_key: "",
					slot_id: 0,
					prompt: `${SYSTEM_PROMPT}\n\n${this.historyText()}`,
				}),
			});
			const data = await res.json();
			this.history.push({ user: "bot", message: data.content });
			return data.content;
		} catch (e) {
			return "エラーが発生しました";
		}
	}
	historyText() {
		return this.history.map((x) => `${x.user}: ${x.message}`).join("\n\n");
	}
}

export const llamaCppQueues = new Map<
	string,
	{ chat: LLamaCppChat; queue: { text: string; message: Message<true> }[] }
>();

export function resetLLamaCppChat(channelId: string) {
	if (llamaCppQueues.has(channelId)) {
		const q = llamaCppQueues.get(channelId)!;
		q.chat = new LLamaCppChat();
		llamaCppQueues.set(channelId, q);
	}
}

export async function pushLLamaCppQueue(
	content: string,
	message: Message<true>,
) {
	if (!llamaCppQueues.has(message.channelId)) {
		llamaCppQueues.set(message.channelId, {
			chat: new LLamaCppChat(),
			queue: [],
		});
	}
	const { chat, queue } = llamaCppQueues.get(message.channelId)!;
	if (queue.length !== 0) {
		queue.push({ text: content, message });
		return;
	}
	queue.push({ text: content, message });
	while (queue.length) {
		const { text, message } = queue.shift()!;
		const msg = await message.reply("ラマは思考しています...");
		const resText = await chat.chat(text);
		if (resText.length == 0) {
			await msg.edit("ラマは疲れているようです...");
			continue;
		}
		if (resText.length > 1900) {
			await msg.edit({
				content: "熟考しすぎてしまったようです",
				files: [{ attachment: Buffer.from(resText), name: "reply.txt" }],
			});
			continue;
		}
		await msg.edit(`ラマは元気に返事をしてくれました！\n${resText}`);
	}
}
