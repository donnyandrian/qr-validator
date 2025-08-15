"use server";

import type { ValidationType } from "~/lib/validation";
import { datasetPath, datasetKey, inputKey } from "./orkess4/server";
import type { DataType } from "~/data/orkess4/type";
import { csvToJson } from "~/data/helper";

export async function getDetailedValue(entry: ValidationType) {
    const keyV = entry[inputKey];

    const data = await csvToJson<DataType>(datasetPath, datasetKey);

    if (keyV in data) return data[keyV];
    return undefined;
}

export async function getInputKey() {
    return inputKey;
}

export async function getDatasetKey() {
    return datasetKey;
}

export type { DataType as DatasetType };
