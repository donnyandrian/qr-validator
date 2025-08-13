"use client";

import { memo, type ReactNode } from "react";
import type { DataType } from "~/data/orkess4/type";

type DataBuilderType<T = DataType> = {
    [K in keyof T]: (value: T[K]) => ReactNode;
};

const TextFormat = memo(function TextFormat({ value }: { value: string }) {
    return (
        <p className="w-full rounded-md bg-gray-100 p-3 text-sm break-words text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {value}
        </p>
    );
});

const ImageFormat = memo(function ImageFormat({ value }: { value: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={value} alt="Foto" className="min-w-42 w-7/10 h-full min-h-64 object-contain" />;
});

export const builder: DataBuilderType = {
    prodi: (value: string) => <TextFormat key={value} value={value} />,
    asal: (value: string) => <TextFormat key={value} value={value} />,
    foto: (value: string) => <ImageFormat key={value} value={value} />,
};
