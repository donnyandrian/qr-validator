import fs from "fs";
import { format } from "@fast-csv/format";

type Item = {
    id: string;
    data: string;
    status: string;
    validatorName: string;
    validatedAt: string;
};

function jsonToCsv(data: Item[], output: string): void {
    if (data.length < 1) {
        console.log("No data found.");
        return;
    }

    const headers = Object.keys(data[0]!);

    const stream = format({ headers });
    stream.pipe(fs.createWriteStream(output));

    for (const row of data) {
        stream.write(
            headers.map((header) =>
                header !== "validatedAt"
                    ? row[header as keyof Item]
                    : new Date(row[header]).toLocaleString(),
            ),
        );
    }

    stream.end();

    console.log(`Data saved to ${output}`);
}

function main() {
    const data = JSON.parse(fs.readFileSync("history.json", "utf-8")) as Item[];
    jsonToCsv(data, "history.csv");
}

main();
