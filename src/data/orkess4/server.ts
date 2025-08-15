import "server-only";
import type { DataType } from "~/data/orkess4/type";
import type { ValidationType } from "~/schemas/validations/orkess4";

// Used in validation
export const inputKey: keyof ValidationType = "nim";
// Used in report generation or related
export const datasetKey: keyof DataType = "NIM";
// Path to the dataset
export const datasetPath = "./src/data/orkess4/db.csv";
