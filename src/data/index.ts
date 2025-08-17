"use server";

import type { ValidationType } from "~/lib/validation";
import { datasetPath, datasetKey, inputKey } from "./orkess4/server";
import type { DataType } from "~/data/orkess4/type";
import { createSingletonAsyncLoader, csvToJson } from "~/data/helper";

const _getSingletonData = createSingletonAsyncLoader(() =>
    csvToJson<DataType>(datasetPath, datasetKey),
);

export async function getDataset() {
    return _getSingletonData();
}

export async function getDetailedValue(entry: ValidationType) {
    const keyV = entry;

    const data = await getDataset();

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
