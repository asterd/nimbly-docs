/** A tiny, dependency-free LRU cache used for manifest and recent pages. */
export declare class LRUCache<K, V> {
    private readonly capacity;
    private map;
    constructor(capacity: number);
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): void;
    clear(): void;
}
