import type { ValidationType } from "~/lib/validation";
import { data, key, builder } from "./orkess4";

const getDetailedValue = (entry: ValidationType) => {
    const keyV = entry[key];

    if (keyV in data) return data[keyV];
    return undefined;
};

const getBuiltComp = (entry: ValidationType) => {
    const detailed = getDetailedValue(entry);

    if (!detailed) return undefined;

    const built = Object.entries(detailed).map(([key, value]) => {
        if (key in builder) {
            return builder[key as keyof typeof builder](value);
        }
    });

    return built;
};

export { data, getDetailedValue, getBuiltComp };
