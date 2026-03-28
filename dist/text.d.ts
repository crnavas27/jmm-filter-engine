/**
 * @file src/utils/text.ts
 * @description A collection of utility functions for text normalization and tokenization.
 *
 * These helpers are primarily used by the matching and filtering algorithms in the
 * recommendations feature. They ensure that string comparisons are consistent and
 * provide tools for breaking down descriptions into meaningful parts.
 */
/**
 * A powerful normalization function that cleans a string for robust matching.
 * It converts the text to uppercase, removes all non-alphanumeric characters
 * (replacing them with spaces), and collapses multiple spaces into one.
 * @param {string} text - The input string to normalize.
 * @returns {string} The cleaned and normalized string.
 */
export declare function normalize(text: string): string;
/**
 * Checks if a given string includes any of a list of substrings in a case-insensitive manner.
 * @param {string} text - The string to search within.
 * @param {string[]} needles - An array of substrings to search for.
 * @returns {boolean} True if any of the `needles` are found in `text`.
 */
export declare function includesAny(text: string, needles: string[]): boolean;
/**
 * Extracts the primary tokens from a product description. This is based on the
 * heuristic that the most important identifying information (like the model name)
 * often comes before the first comma.
 * @param {string} desc - The full product description.
 * @returns An object containing two versions of the primary tokens:
 *          - `raw`: The original text before the first comma.
 *          - `alpha`: The same text but with all digits removed, useful for pattern matching.
 */
export declare function getPrimaryTokens(desc: string): {
    raw: string;
    alpha: string;
};
/**
 * Extracts the very first space-delimited token from the primary portion of a
 * description (i.e., from the text before the first comma). Hyphens are kept
 * as part of the token; other punctuation is removed. Result is uppercased.
 */
export declare function getPrimaryFirstWord(desc: string): string;
/**
 * Removes a trailing "-RX" suffix (case-insensitive) from a single token.
 */
export declare function stripRxSuffix(word: string): string;
/**
 * Strips a trailing whole-number version suffix (e.g. "-2.0", "-3.0") from the
 * FIRST word of a raw description string, before the dot is removed by later processing.
 * e.g. "JAGGER-2.0, Black Matte, Demo" → "JAGGER, Black Matte, Demo"
 * Only matches N.0 (not arbitrary decimals like 1.5) to avoid false positives.
 */
export declare function stripVersionSuffix(text: string): string;
/**
 * Removes leading descriptor prefixes such as "ASIAN FIT:" or "RESERVE:" that
 * occasionally precede the actual frame name in CSV descriptions.
 */
export declare function stripDescriptorPrefixes(text: string): string;
//# sourceMappingURL=text.d.ts.map