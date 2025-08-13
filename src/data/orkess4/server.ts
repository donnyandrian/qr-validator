import "server-only";
import type { DataType } from "~/data/orkess4/type";
import type { ValidationType } from "~/schemas/validations/orkess4";

export const data = {} as Record<string, DataType>;

export const inputKey: keyof ValidationType = "nim";
export const datasetKey = "NIM";
