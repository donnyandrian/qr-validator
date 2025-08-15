import "server-only";
import fs from "fs";
import { parse } from "@fast-csv/parse";

export async function csvToJson<T extends Record<string, string>>(
    path: string,
    datasetKey: keyof T,
): Promise<Record<string, T>> {
    return new Promise((resolve, reject: (error: Error) => void) => {
        const input = fs.createReadStream(path);
        const parser = parse({ headers: true });

        const result: Record<string, T> = {};

        parser
            .on("error", () => {
                reject(new Error("Error parsing CSV"));
            })
            .on("data", (data: T) => {
                result[data[datasetKey]] = data;
            })
            .on("end", () => {
                resolve(result);
            });

        input.pipe(parser);
    });
}
