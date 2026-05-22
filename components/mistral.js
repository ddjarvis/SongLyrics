import { inspect } from 'node:util';

import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({
  apiKey: process.env["MISTRAL_API_KEY"] ?? "",
});

const prompt = `ROLE & TASK
Act as an expert Multilingual Localization Specialist and Linguist. Your task is to process the provided text and transliterate all East Asian characters into their standard Latin-script phonetic equivalents based on the specific language:
1. Japanese characters (Kanji, Hiragana, Katakana) must be transliterated into Hepburn Romaji.
2. Chinese characters (Simplified or Traditional Mandarin) must be transliterated into Hanyu Pinyin (include standard tone marks).
3. Korean characters (Hangul) must be transliterated into the Revised Romanization of Korean.

CONSTRAINTS & DETAILS
* Preserve Non-Target Text: Keep all original English words, numerals, spacing, and standard punctuation exactly as they appear in the source text. Do not touch them.
* Timestamp Protection: Crucially, do NOT alter, delete, or modify any embedded timestamps (e.g., [00:01.23], <00:02.50>). Treat them as protected plaintext and leave them in their exact original positions.
* Strictly No Translation: Do not translate the meaning of the words into English or any other language. Only perform phonetic transliteration/romanization.
* Casing & Spacing: Use standard sentence casing and appropriate word spacing for the romanized output to ensure readability.

OUTPUT FORMAT
The final output must strictly contain only the fully processed text (the romanized strings alongside their original timestamps and formatting). Do not include any introductory text, conversational filler, or markdown explanations.`;

async function runMistral(lrc) {
  const result = await mistral.chat.complete({
    model: "mistral-medium-latest",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: lrc,
      },
    ],
    responseFormat: {
      type: "text",
    },
  });
  return result;
}

async function run(lrc) {
	const res = await runMistral(lrc);
	const trLrc = res.choices[0].message.content;
	return trLrc;
}

export default async function(lrc) {
	let tr = await run(lrc);
	return tr;
}