import { ChatInputCommandInteraction } from "discord.js";
import { evar } from "./var";

const endpoint = evar("IMAGINE_ENDPOINT");

export async function imagineCommand(i: ChatInputCommandInteraction) {
	const count = i.options.getInteger("count") ?? 1;
	const pos = i.options.getString("positive", true);
	const neg = i.options.getString("negative") || undefined;
	const size = i.options.getInteger("size") ?? 1024;
	const seed = i.options.getInteger("seed") || undefined;
	const params = new URLSearchParams({
		count: count.toString(),
		pos,
		size: size.toString(),
	});
	if (neg) {
		params.append("neg", neg);
	}
	if (seed) {
		params.append("seed", seed.toString());
	}
	try {
		await i.deferReply();
		const res = await fetch(`${endpoint}/?${params.toString()}`, {
			headers: {
				"Content-Type": "application/json",
			},
		});
		const seed = res.headers.get("Seed") ?? "Unknown";
		const data = await res.arrayBuffer();
		await i.editReply({
			content: `Seed: ${seed}`,
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
