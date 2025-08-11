export const data = {
    "2222222222222222": { foto: "/ignored/orkess4/2222222222222222.png" },
    "2121": { foto: "/ignored/orkess4/2121.png" },
    "23100002": { foto: "/ignored/orkess4/23100002.png" },
    a: { foto: "/ignored/orkess4/a.png" },
} as Record<string, { foto: string }>;

export const key = "nim";

export const builder = {
    foto: async (value: string) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            key={value}
            src={value}
            alt="Foto"
            className="w-full object-cover"
        />
    ),
};
