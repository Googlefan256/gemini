import { ChatInputCommandInteraction } from "discord.js";
import { evar } from "./var";

const endpoint = evar("IMAGINE_ENDPOINT");

export async function imagineCommand(i: ChatInputCommandInteraction) {
	const count = i.options.getInteger("count") ?? 1;
	const pos = i.options.getString("positive", true);
	const neg = i.options.getString("negative") || undefined;
	const size = i.options.getInteger("size") ?? 1024;
	const params = new URLSearchParams({
		count: count.toString(),
		pos,
		size: size.toString(),
	});
	if (neg) {
		params.append("neg", neg);
	}
	try {
		await i.deferReply();
		const res = await fetch(`${endpoint}/?${params.toString()}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});
		const data = await res.arrayBuffer();
		await i.editReply({
			files: [
				{
					attachment: Buffer.from(data),
					name: "image.png",
				},
			],
		});
	} catch {
		if (i.replied || i.deferred) {
			await i.editReply("エラーが発生しました");
			return;
		}
		await i.reply("エラーが発生しました");
	}
}
