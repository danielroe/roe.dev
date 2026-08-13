/**
 * Lexicon record types carry a `[k: string]: unknown` index signature,
 * which propagates through `Omit`/`Partial`/`Pick` and breaks type
 * narrowing in editor forms. `Strict<T>` collapses the type back to just
 * its declared properties.
 */
export type Strict<T> = { [K in keyof T as string extends K ? never : K]: T[K] }

/**
 * Widens lexicon string-format brands (`DatetimeString`, `AtUriString`, …)
 * back to plain `string`, leaving `$type` discriminants intact.
 */
export type Loose<T> = T extends (infer U)[]
  ? Loose<U>[]
  : T extends object
    ? { [K in keyof T]: K extends '$type' ? T[K] : Loose<T[K]> }
    : T extends string ? string : T
