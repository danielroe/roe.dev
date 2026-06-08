/**
 * Lexicon record types carry a `[k: string]: unknown` index signature,
 * which propagates through `Omit`/`Partial`/`Pick` and breaks type
 * narrowing in editor forms. `Strict<T>` collapses the type back to just
 * its declared properties.
 */
export type Strict<T> = { [K in keyof T as string extends K ? never : K]: T[K] }
