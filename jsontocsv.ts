import fs from "fs";

/**
 * Converts an array of objects (JSON) to a CSV string.
 * @param data The array of objects to convert.
 * @returns A CSV formatted string.
 */
function jsonToCsv(data: any[]): string {
    if (!data || data.length === 0) {
        return "";
    }

    // 1. Extract headers from the keys of the first object
    const headers = Object.keys(data[0]);

    // 2. Create the header row
    const csvRows = [headers.join(",")];

    // 3. Create a row for each object in the data
    for (const row of data) {
        const values = headers.map((header) => {
            const escaped = ("" + row[header]).replace(/"/g, '""'); // Escape double quotes
            return `"${escaped}"`; // Wrap all values in double quotes
        });
        csvRows.push(values.join(","));
    }

    // 4. Join all rows with a newline character
    return csvRows.join("\n");
}

function main() {
    const data = JSON.parse(fs.readFileSync("history.json", "utf-8"));
    const csv = jsonToCsv(data);
    fs.writeFileSync("history.csv", csv);
}

main();
