const IMAGINE_API_URL =
	process.env.TRANSLATE_API_URL || "http://localhost:3000";
import { request } from "undici";

export const translate = async (text: string, to: string) => {
	const res = await request(
		`${IMAGINE_API_URL}/translate?text=${encodeURIComponent(
			text,
		)}&to=${encodeURIComponent(to)}`,
	);
	return await res.body.text();
};
