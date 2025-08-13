import fs from "fs";
import * as csv from "fast-csv";
import type { ValidationType } from "~/lib/validation";

type History = {
    id: string;
    data: string;
    status: string;
    validatorName: string;
    validatedAt: string;
}[];

const getKeys = () => {
    const history = JSON.parse(
        fs.readFileSync("history.json", "utf-8"),
    ) as History;

    const data: string[] = [];
    for (const entry of history) {
        try {
            const parsed = JSON.parse(entry.data) as ValidationType;
            data.push(parsed.nim);
        } catch {
            continue;
        }
    }

    return new Set(data);
};

/**
 * Compares a CSV file against a set of reference data using fast-csv.
 * @param {string} inputCsvPath - Path to the input CSV file.
 * @param {string} outputCsvPath - Path for the generated output CSV file.
 */
async function compareAndMarkRowsWithFastCsv(
    inputCsvPath: string,
    outputCsvPath: string,
): Promise<void> {
    const availableSet = getKeys();
    console.log("Reference data loaded into a Set.");

    const columnToCompare = "NIM";
    const newColumnName = "Kehadiran";

    const readStream = fs.createReadStream(inputCsvPath);
    const writeStream = fs.createWriteStream(outputCsvPath);
    const parser = csv.parse({ headers: true });

    parser.once("headers", (originalHeaders: string[]) => {
        console.log("Original headers found:", originalHeaders);

        const insertAtIndex = 0;
        const newHeaders = [...originalHeaders]; // Make a copy
        newHeaders.splice(insertAtIndex, 0, newColumnName); // Insert the new column

        console.log("New header order will be:", newHeaders);

        const formatter = csv
            .format({ headers: newHeaders })
            .transform((row, next) => {
                const valueToCheck = row[
                    columnToCompare as keyof typeof row
                ] as string;
                const availabilityStatus = availableSet.has(valueToCheck)
                    ? "Hadir"
                    : "Alpa";

                const newRow = { ...row, [newColumnName]: availabilityStatus };
                return next(null, newRow);
            });

        parser
            .pipe(formatter)
            .on("error", (err) => console.error("Format Error:", err))
            .pipe(writeStream)
            .on("error", (err) => console.error("Write Error:", err));
    });

    writeStream.on("finish", () => {
        console.log(`Success! New file created at: ${outputCsvPath}`);
    });

    readStream.pipe(parser);
}

async function main() {
    await compareAndMarkRowsWithFastCsv(
        "./src/data/db_orkess4.csv",
        "db_orkess4_marked.csv",
    );
}

await main();
