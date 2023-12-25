import {
	GoogleGenerativeAI,
	HarmBlockThreshold,
	HarmCategory,
} from "@google/generative-ai";
import { evar } from "./var";
import { request } from "undici";

const genAI = new GoogleGenerativeAI(evar("GEMINI_KEY"));
export const model = genAI.getGenerativeModel({ model: "gemini-pro" });
export const visionModel = genAI.getGenerativeModel({
	model: "gemini-pro-vision",
});
const safetySettings = [
	HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
	HarmCategory.HARM_CATEGORY_HARASSMENT,
	HarmCategory.HARM_CATEGORY_HATE_SPEECH,
	HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
	HarmCategory.HARM_CATEGORY_UNSPECIFIED,
].map((category) => ({
	category,
	threshold: HarmBlockThreshold.BLOCK_NONE,
}));
export const modelZero = genAI.getGenerativeModel({
	model: "gemini-pro",
	safetySettings,
	generationConfig: {
		temperature: 0,
	},
});
export const visionModelZero = genAI.getGenerativeModel({
	model: "gemini-pro-vision",
	safetySettings,
	generationConfig: {
		temperature: 0,
	},
});

export async function resolveImages(
	attachments: { mime: string; url: string }[],
) {
	return (
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
}
