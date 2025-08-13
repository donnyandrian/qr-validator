"use server";

import type { ValidationType } from "~/lib/validation";
import { data, datasetKey, inputKey } from "./orkess4/server";

export async function getDetailedValue(entry: ValidationType) {
    const keyV = entry[inputKey];

    if (keyV in data) return data[keyV];
    return undefined;
}

export async function getInputKey() {
    return inputKey;
}

export async function getDatasetKey() {
    return datasetKey;
}
