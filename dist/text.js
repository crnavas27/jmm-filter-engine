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
export function normalize(text) {
    return (text || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Checks if a given string includes any of a list of substrings in a case-insensitive manner.
 * @param {string} text - The string to search within.
 * @param {string[]} needles - An array of substrings to search for.
 * @returns {boolean} True if any of the `needles` are found in `text`.
 */
export function includesAny(text, needles) {
    const lower = text.toLowerCase();
    return needles.some(n => lower.includes(n));
}
/**
 * Extracts the primary tokens from a product description. This is based on the
 * heuristic that the most important identifying information (like the model name)
 * often comes before the first comma.
 * @param {string} desc - The full product description.
 * @returns An object containing two versions of the primary tokens:
 *          - `raw`: The original text before the first comma.
 *          - `alpha`: The same text but with all digits removed, useful for pattern matching.
 */
export function getPrimaryTokens(desc) {
    const beforeComma = (desc || '').split(',')[0] || '';
    const raw = (beforeComma || '').trim();
    const alpha = raw.replace(/\d+/g, '').trim();
    return { raw, alpha };
}
/**
 * Extracts the very first space-delimited token from the primary portion of a
 * description (i.e., from the text before the first comma). Hyphens are kept
 * as part of the token; other punctuation is removed. Result is uppercased.
 */
export function getPrimaryFirstWord(desc) {
    const beforeComma = (desc || '').split(',')[0] || '';
    const trimmed = String(beforeComma || '').trim();
    const first = (trimmed.match(/^[^\s]+/) || [''])[0];
    // Keep letters, digits, and hyphens; remove other punctuation.
    return first.replace(/[^A-Za-z0-9\-]+/g, '').toUpperCase();
}
/**
 * Removes a trailing "-RX" suffix (case-insensitive) from a single token.
 */
export function stripRxSuffix(word) {
    return String(word || '').replace(/-RX$/i, '');
}
/**
 * Strips a trailing whole-number version suffix (e.g. "-2.0", "-3.0") from the
 * FIRST word of a raw description string, before the dot is removed by later processing.
 * e.g. "JAGGER-2.0, Black Matte, Demo" → "JAGGER, Black Matte, Demo"
 * Only matches N.0 (not arbitrary decimals like 1.5) to avoid false positives.
 */
export function stripVersionSuffix(text) {
    return String(text || '').replace(/^(\S+?)-\d+\.0(?=[,\s]|$)/i, '$1');
}
const descriptorPrefixRe = /^(?:\s*(?:sample|reserve|asian\s*fit)\s*:\s*)+/i;
/**
 * Removes leading descriptor prefixes such as "ASIAN FIT:" or "RESERVE:" that
 * occasionally precede the actual frame name in CSV descriptions.
 */
export function stripDescriptorPrefixes(text) {
    return String(text || '').replace(descriptorPrefixRe, '').trim();
}
