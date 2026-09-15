/** A reactive value read through `current`, like the classes in `svelte/reactivity`. */
export type ReadableBox<TValue> = { readonly current: TValue };
