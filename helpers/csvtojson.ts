import { parse } from "@fast-csv/parse";
import fs from "fs";

type Row = Record<string, string>;

export const csvToJson = (path: string): Promise<Row[]> => {
    return new Promise((resolve, reject: (error: Error) => void) => {
        const input = fs.createReadStream(path);
        const parser = parse({ headers: true });

        const result: Row[] = [];

        parser
            .on("error", () => {
                reject(new Error("Error parsing CSV"));
            })
            .on("data", (data: Row) => {
                result.push(data);
            })
            .on("end", () => {
                resolve(result);
            });

        input.pipe(parser);
    });
};

async function main() {
    const data = await csvToJson("./src/data/orkess4/db.csv");
    console.log(JSON.stringify(data, null, 2));
}

await main();
