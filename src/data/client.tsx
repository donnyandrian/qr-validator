"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import {
    type DatasetType,
    getDatasetKey,
    getDetailedValue,
    getInputKey,
} from "~/data";
import { builder } from "~/data/orkess4/client";
import type { ValidationType } from "~/lib/validation";

async function getBuiltComp(entry: ValidationType) {
    const detailed = await getDetailedValue(entry);
    if (!detailed) return undefined;

    const built = Object.entries(detailed).map(([key, value]) => {
        if (key in builder) {
            return builder[key as keyof typeof builder](value);
        }
    });

    return built;
}

export function BuiltComp({ entry }: { entry: ValidationType }) {
    const [result, setResult] = useState<ReactNode[] | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        getBuiltComp(entry).then(
            (result) => {
                setResult(result);
                setLoading(false);
            },
            (err) => {
                if (err instanceof Error) console.error(err.message);

                setLoading(false);
            },
        );
    }, [entry]);

    return (
        <>
            {loading && (
                <div className="mt-6 flex w-full items-center justify-center">
                    <Loader2 className="size-6 animate-spin" />
                </div>
            )}
            {result && <>{result}</>}
        </>
    );
}

export const useInputDataKey = () => {
    const [key, setKey] = useState<string | null>(null);
    useEffect(() => {
        getInputKey().then(setKey, () => setKey(null));
    }, []);
    return key;
};

export const useDatasetKey = () => {
    const [key, setKey] = useState<keyof DatasetType | null>(null);
    useEffect(() => {
        getDatasetKey().then(setKey, () => setKey(null));
    }, []);
    return key;
};
