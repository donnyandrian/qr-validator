"use server";

import type { ValidationType } from "~/lib/validation";
import { datasetPath, datasetKey, inputKey } from "./orkess4/server";
import type { DataType } from "~/data/orkess4/type";
import { csvToJson } from "~/data/helper";

let cachedDataset: Record<string, DataType> = {};

export async function getDetailedValue(entry: ValidationType) {
    const keyV = entry;

    if (Object.keys(cachedDataset).length === 0) {
        console.log("Loading dataset (detailed value)...");
        cachedDataset = await csvToJson<DataType>(datasetPath, datasetKey);
    }

    if (keyV in cachedDataset) return cachedDataset[keyV];
    return undefined;
}

export async function getInputKey() {
    return inputKey;
}

export async function getDatasetKey() {
    return datasetKey;
}

export type { DataType as DatasetType };
