import fs from "fs";
import { format } from "@fast-csv/format";

function jsonToCsv2(data: any[], output: string): void {
    const headers = Object.keys(data[0]);

    const stream = format({ headers });
    stream.pipe(fs.createWriteStream(output));

    for (const row of data) {
        stream.write(
            headers.map((header) =>
                header !== "validatedAt"
                    ? row[header]
                    : new Date(row[header]).toLocaleString(),
            ),
        );
    }

    stream.end();
}

function main() {
    const data = JSON.parse(fs.readFileSync("history.json", "utf-8"));
    jsonToCsv2(data, "history.csv");
}

main();
