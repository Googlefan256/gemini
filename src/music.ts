const MUSIC_API_URL = process.env.MUSIC_API_URL || "http://localhost:3000";
import { request } from "undici";

export const music = async (text: string) => {
	const res = await request(
		`${MUSIC_API_URL}/?text=${encodeURIComponent(text)}`,
		{
			bodyTimeout: 10000,
		},
	);
	return res.body.arrayBuffer();
};
