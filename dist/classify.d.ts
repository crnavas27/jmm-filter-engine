/**
 * Analyzes a raw CSV row and returns a set of boolean flags describing its type.
 * The logic is based on a series of heuristics that check for keywords and patterns
 * in the 'Product' (SKU) and 'Descriptionz' columns.
 * @param {Record<string, string>} row - A single row from the parsed CSV file.
 * @returns An object containing boolean flags for each possible category.
 */
export declare function classifyRow(row: Record<string, string>): {
    isSample: boolean;
    isReserve: boolean;
    isRx: boolean;
    isFront: boolean;
    isTemples: boolean;
    isHardware: boolean;
    isParts: boolean;
    isClipOn: boolean;
    isLens: boolean;
    isHorn: boolean;
    isCompleteFrame: boolean;
    isOther: boolean;
    isUnknown: boolean;
    isGood: boolean;
    isDemo: boolean;
    isDemoLens: boolean;
};
//# sourceMappingURL=classify.d.ts.map