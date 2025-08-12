"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { getDetailedValue } from "~/data";
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
            },
        );
    }, [entry]);

    return (
        <>
            {loading && (
                <div className="flex items-center justify-center w-full mt-6">
                    <Loader2 className="size-6 animate-spin" />
                </div>
            )}
            {result && <>{result}</>}
        </>
    );
}
