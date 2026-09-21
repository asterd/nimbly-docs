/**
 * Network loader with AbortController-based cancellation, a configurable
 * timeout, one retry for transient/idempotent errors, and an in-memory LRU for
 * recently fetched Markdown pages.
 */
import { LRUCache } from "./cache.js";
import { LIMITS } from "./constants.js";
import type { DocsError } from "./types.js";

export class LoaderError extends Error {
  code: DocsError["code"];
  cause?: unknown;
  constructor(code: DocsError["code"], message: string, cause?: unknown) {
    super(message);
    this.name = "LoaderError";
    this.code = code;
    this.cause = cause;
  }
}

export interface LoaderOptions {
  timeout: number;
  maxPageBytes: number;
}

export class Loader {
  private pageCache = new LRUCache<string, string>(LIMITS.pageCacheSize);
  /** Tracks the in-flight page request so a new navigation can cancel it. */
  private inflight: AbortController | null = null;

  constructor(private readonly opts: LoaderOptions) {}

  /** Fetch and parse a JSON manifest. Not cached across reloads (short server cache is expected). */
  async fetchManifest(url: string): Promise<unknown> {
    const text = await this.fetchText(url, LIMITS.maxManifestBytes, "manifest-fetch");
    try {
      return JSON.parse(text);
    } catch (cause) {
      throw new LoaderError("manifest-invalid", "manifest is not valid JSON", cause);
    }
  }

  /** Fetch Markdown by URL, using the LRU cache and cancelling any prior page fetch. */
  async fetchPage(url: string): Promise<string> {
    return this.fetchFirst([url]);
  }

  /**
   * Fetch the first candidate URL that responds successfully, sharing one
   * AbortController across the sequence so a new navigation cancels the whole
   * attempt. Any cached candidate short-circuits the sequence. Only the final
   * failure is surfaced when every candidate fails.
   */
  async fetchFirst(candidates: string[]): Promise<string> {
    const urls = candidates.filter((u, i) => u && candidates.indexOf(u) === i);
    if (urls.length === 0) throw new LoaderError("page-fetch", "no source URL for page");

    this.inflight?.abort();
    const controller = new AbortController();
    this.inflight = controller;

    try {
      let lastError: unknown = null;
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]!;
        const isLast = i === urls.length - 1;
        // Honour the candidate priority order: a cached lower-priority URL must
        // never shadow a higher-priority one (e.g. localized variant first).
        const cached = this.pageCache.get(url);
        if (cached !== undefined) return cached;
        try {
          const text = await this.fetchText(url, this.opts.maxPageBytes, "page-fetch", controller);
          this.pageCache.set(url, text);
          return text;
        } catch (err) {
          // Abort/timeout should stop the whole sequence immediately.
          if (err instanceof LoaderError && (err.code === "network-timeout" || err.code === "offline")) throw err;
          lastError = err;
          if (isLast) throw err;
          // Otherwise fall through to the next candidate (e.g. 404 on this path).
        }
      }
      throw (lastError as Error) ?? new LoaderError("page-fetch", "page not found");
    } finally {
      if (this.inflight === controller) this.inflight = null;
    }
  }

  /** Abort the current in-flight page request, if any. */
  abortPending(): void {
    this.inflight?.abort();
    this.inflight = null;
  }

  clearCache(): void {
    this.pageCache.clear();
  }

  private async fetchText(
    url: string,
    maxBytes: number,
    code: DocsError["code"],
    external?: AbortController
  ): Promise<string> {
    const attempt = async (): Promise<string> => {
      const controller = external ?? new AbortController();
      const timer = setTimeout(() => controller.abort(new DOMException("timeout", "TimeoutError")), this.opts.timeout);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          credentials: "same-origin",
          redirect: "follow",
        });
        if (!res.ok) {
          const transient = res.status >= 500 || res.status === 429;
          throw new LoaderError(code, `request failed with ${res.status}`, { status: res.status, transient });
        }
        // Guard against oversized responses when the server advertises length.
        const len = Number(res.headers.get("content-length") || 0);
        if (len && len > maxBytes) {
          throw new LoaderError("page-too-large", `content exceeds ${maxBytes} bytes`);
        }
        const text = await res.text();
        if (text.length > maxBytes) {
          throw new LoaderError("page-too-large", `content exceeds ${maxBytes} bytes`);
        }
        return text;
      } catch (err) {
        if (err instanceof LoaderError) throw err;
        const e = err as { name?: string };
        if (e?.name === "TimeoutError") throw new LoaderError("network-timeout", "request timed out", err);
        if (e?.name === "AbortError") throw new LoaderError("network-timeout", "request aborted", err);
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          throw new LoaderError("offline", "browser is offline", err);
        }
        throw new LoaderError(code, "network error", err);
      } finally {
        clearTimeout(timer);
      }
    };

    try {
      return await attempt();
    } catch (err) {
      // One retry for transient, idempotent GET failures. Never retry 4xx.
      const le = err as LoaderError;
      const cause = le.cause as { transient?: boolean } | undefined;
      const retriable = le.code === "network-timeout" || cause?.transient === true;
      if (retriable && !external) {
        return await attempt();
      }
      throw err;
    }
  }
}
