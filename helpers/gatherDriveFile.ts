"use server";

import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";

type Size = {
    width: number;
    height: number;
};

const scaleByHeight = {
    "800": (w: number, h: number): Size => ({
        width: (w * 800) / h,
        height: 800,
    }),
    "840": (w: number, h: number): Size => ({
        width: (w * 840) / h,
        height: 840,
    }),
    "900": (w: number, h: number): Size => ({
        width: (w * 900) / h,
        height: 900,
    }),
};

const scaleByRatio = (w: number, h: number): Size => {
    const ratio = w / h;
    switch (ratio) {
        case 0.67:
            return scaleByHeight["900"](w, h);
        case 0.83:
        case 0.71:
            return scaleByHeight["840"](w, h);
        default:
            return scaleByHeight["800"](w, h);
    }
};

export async function generateImage(path: string, name: string) {
    try {
        const templateImage = await loadImage(path);

        const rescaled = scaleByRatio(
            templateImage.width,
            templateImage.height,
        );

        const canvas = createCanvas(rescaled.width, rescaled.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

        const blob = await canvas.convertToBlob({ mime: "image/png" });

        // Blob to file
        fs.writeFileSync(
            "./public/ignored/orkess4/" + name,
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
