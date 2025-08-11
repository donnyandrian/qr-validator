"use server";

import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";

export async function generateImage(path: string, name: string) {
    try {
        const templateImage = await loadImage(path);

        const canvas = createCanvas(templateImage.width, templateImage.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(templateImage, 0, 0);

        const blob = await canvas.convertToBlob({ mime: "image/png" });

        // Blob to file
        fs.writeFileSync(
            "./public/ignored/" + name,
            Buffer.from(await blob.arrayBuffer()),
        );
    } catch (error) {
        console.error(`Error generating image (${name}):`, error);
        return null;
    }
}

async function main() {
    const data: Record<string, { foto: string }> = {};

    console.log("Starting...");

    const tasks = Object.entries(data).map(
        async ([key, value], index, array) => {
            await generateImage(value.foto, key + ".png");
            console.log(`Generated ${key}.png (${index + 1}/${array.length})`);
        },
    );

    await Promise.all(tasks);
}

await main();
