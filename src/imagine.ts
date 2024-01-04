const IMAGINE_API_URL = process.env.IMAGINE_API_URL || "http://localhost:3000";
import { request } from "undici";

export const imagine = async (text: string, negative: string) => {
	const res = await request(
		`${IMAGINE_API_URL}/?text=${encodeURIComponent(
			text,
		)}&negative=${encodeURIComponent(negative)}`,
		{
			bodyTimeout: 100000,
		},
	);
	return res.body.arrayBuffer();
};
