(function attachVisitorCounter(global) {
  const DEFAULT_TIMEOUT_MS = 5000;
  const MAX_TIMEOUT_MS = 10000;

  function isValidEndpoint(endpoint) {
    if (typeof endpoint !== "string" || endpoint.trim() === "") return false;

    try {
      const parsed = new URL(endpoint);
      return (
        parsed.protocol === "https:" &&
        parsed.hostname !== "" &&
        parsed.username === "" &&
        parsed.password === ""
      );
    } catch {
      return false;
    }
  }

  function boundedTimeout(timeoutMs) {
    if (!Number.isFinite(timeoutMs)) return DEFAULT_TIMEOUT_MS;
    return Math.min(MAX_TIMEOUT_MS, Math.max(1, Math.floor(timeoutMs)));
  }

  function isDemoMode(href) {
    if (typeof href !== "string") return false;
    try {
      return new URL(href).searchParams.get("demoVisitors") === "1";
    } catch {
      return false;
    }
  }

  function demoCount(random = Math.random) {
    const sample = typeof random === "function" ? Number(random()) : Number.NaN;
    const normalized = Number.isFinite(sample) ? Math.min(0.999999, Math.max(0, sample)) : 0;
    return 24 + Math.floor(normalized * 137);
  }

  async function fetchCount(endpoint, fetchImpl, timeoutMs) {
    if (!isValidEndpoint(endpoint)) return undefined;

    const request = typeof fetchImpl === "function" ? fetchImpl : global.fetch?.bind(global);
    if (typeof request !== "function" || typeof global.AbortController !== "function") {
      return undefined;
    }

    const controller = new global.AbortController();
    const timer = global.setTimeout(() => controller.abort(), boundedTimeout(timeoutMs));

    try {
      const response = await request(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
        signal: controller.signal,
      });
      if (!response || response.ok !== true || typeof response.json !== "function") {
        return undefined;
      }

      const payload = await response.json();
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;

      const count = payload.count;
      return typeof count === "number" && Number.isSafeInteger(count) && count >= 0
        ? count
        : undefined;
    } catch {
      return undefined;
    } finally {
      global.clearTimeout(timer);
      controller.abort();
    }
  }

  global.PdepVisitorCounter = Object.freeze({ isValidEndpoint, isDemoMode, demoCount, fetchCount });
})(typeof window === "object" ? window : globalThis);
