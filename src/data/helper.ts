import "server-only";
import fs from "fs";
import { parse } from "@fast-csv/parse";

export async function csvToJson<T extends Record<string, string>>(
    path: string,
    datasetKey: keyof T,
): Promise<Record<string, T>> {
    return new Promise((resolve, reject: (error: Error) => void) => {
        const input = fs.createReadStream(path);
        const parser = parse({ headers: true });

        const result: Record<string, T> = {};

        parser
            .on("error", () => {
                reject(new Error("Error parsing CSV"));
            })
            .on("data", (data: T) => {
                result[data[datasetKey]] = data;
            })
            .on("end", () => {
                resolve(result);
            });

        input.pipe(parser);
    });
}

/**
 * Creates a singleton async loader.
 * Ensures that an expensive async function is only ever executed once.
 * Subsequent calls while the first is in-flight will wait for the original to complete
 * and receive its result. After completion, the result is cached.
 *
 * @param loader - The expensive async function to execute. It must not take any arguments.
 * @returns A new function that acts as a singleton gateway to your loader.
 */
export function createSingletonAsyncLoader<T>(
    loader: () => Promise<T>,
): () => Promise<T> {
    let pendingPromise: Promise<T> | null = null;
    let cachedResult: T | undefined = undefined;

    return async (): Promise<T> => {
        // 1. If we have a cached result, return it immediately.
        if (cachedResult !== undefined) {
            console.log("Returning cached result.");
            return cachedResult;
        }

        // 2. If a request is already in flight, wait for it to finish.
        if (pendingPromise) {
            console.log("Another request is in flight. Waiting...");
            return pendingPromise;
        }

        // 3. This is the first request. Execute the loader.
        console.log("First request. Starting the expensive loader...");
        pendingPromise = loader();

        try {
            const result = await pendingPromise;
            // Cache the result for future calls
            cachedResult = result;
            console.log("Loader finished. Caching result.");
            return result;
        } catch (error) {
            // If it fails, don't cache. Let the next call try again.
            console.error("Loader failed:", error);
            throw error; // Re-throw the error so the caller can handle it
        } finally {
            // 4. Clear the pending promise so the next call (if there was an error)
            // or subsequent calls (after a cache reset, if implemented) can proceed.
            pendingPromise = null;
        }
    };
}
