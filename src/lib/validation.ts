import { z, ZodError } from "zod";
import { validationSchema } from "~/schemas/validations/orkess4";
import type { ValidationType } from "~/schemas/validations/orkess4";

type ValidationResult<T> =
    | { success: true; value: T }
    | { success: false; error: ZodError };

export function validate(value: string): ValidationResult<ValidationType> {
    try {
        // First, parse the JSON string into a JavaScript object.
        const dataObject = JSON.parse(value);

        // Use Zod's .parse() method. If validation fails, it throws an error.
        const validatedData = validationSchema.parse(dataObject);

        // If validation is successful, return the typed data.
        return { success: true, value: validatedData };
    } catch (error) {
        // If JSON.parse fails or if Zod's .parse() throws, we catch the error.
        if (error instanceof ZodError) {
            // If it's a Zod validation error, return it in a structured way.
            return { success: false, error: error };
        } else if (error instanceof SyntaxError) {
            // Handle malformed JSON string
            return {
                success: false,
                error: new ZodError([
                    {
                        code: "custom",
                        path: ["json"],
                        message: "Invalid JSON format.",
                    },
                ]),
            };
        } else {
            // Handle other unexpected errors
            return {
                success: false,
                error: new ZodError([
                    {
                        code: "custom",
                        path: ["unknown"],
                        message:
                            "An unexpected error occurred during validation.",
                    },
                ]),
            };
        }
    }
}

export type { ValidationType };
