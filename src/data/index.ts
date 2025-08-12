"use server";

import type { ValidationType } from "~/lib/validation";
import { data, key } from "./orkess4/server";

async function getDetailedValue(entry: ValidationType) {
    const keyV = entry[key];

    if (keyV in data) return data[keyV];
    return undefined;
}

export { getDetailedValue };
