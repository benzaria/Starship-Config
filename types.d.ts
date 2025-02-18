declare global {
    var __awaiter: boolean
}

export type ConverterType = {
    [K: string | symbol | number]: {
        parse: (str: string, ...args: any[]) => object & { $schema?: string },
        stringify: (obj: any, ...args: any[]) => string,
        [J: string | symbol | number]: any,
    }
}
