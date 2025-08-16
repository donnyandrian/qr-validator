import "server-only";
import type { DataType } from "~/data/orkess4/type";

// Used in validation
export const inputKey = "NIM";
// Used in report generation or related
export const datasetKey: keyof DataType = "NIM";
// Path to the dataset
export const datasetPath = "./src/data/orkess4/db.csv";
