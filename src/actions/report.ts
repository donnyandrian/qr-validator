"use server";

import { writeToBuffer, type Row } from "@fast-csv/format";

export async function generateCsv(rows: Row[], datasetKeys: string[]) {
    const csv = await writeToBuffer(rows, {
        headers: ["Present", ...datasetKeys, "Validator", "Status"],
    });

    return new Blob([Buffer.from(csv)], {
        type: "text/csv;charset=utf-8;",
    });
}
