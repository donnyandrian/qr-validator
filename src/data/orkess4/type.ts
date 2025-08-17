export type DataType = {
    NIM: string;
    Nama: string;
    Prodi: string;
    Email: string;
};
export const dataTypeKeys: (keyof DataType)[] = [
    "NIM",
    "Nama",
    "Prodi",
    "Email",
];
