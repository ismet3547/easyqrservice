export type JsonRequestFailure = {
  ok: false;
  reason: "invalid" | "too-large" | "unsupported-media-type" | "timeout";
  status: 400 | 408 | 413 | 415;
};

export type JsonRequestResult = JsonRequestFailure | {
  ok: true;
  value: unknown;
};

function failure(
  reason: JsonRequestFailure["reason"],
  status: JsonRequestFailure["status"],
): JsonRequestFailure {
  return { ok: false, reason, status };
}

export async function readJsonRequest(
  request: Request,
  maximumBytes: number,
  maximumReadMs = 15_000,
): Promise<JsonRequestResult> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes <= 0) {
    throw new RangeError("maximumBytes must be a positive safe integer.");
  }
  if (!Number.isSafeInteger(maximumReadMs) || maximumReadMs <= 0) {
    throw new RangeError("maximumReadMs must be a positive safe integer.");
  }

  const contentType = (request.headers.get("content-type") || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return failure("unsupported-media-type", 415);
  }

  const contentEncoding = (request.headers.get("content-encoding") || "identity")
    .trim()
    .toLowerCase();
  if (contentEncoding !== "identity") {
    return failure("unsupported-media-type", 415);
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
      return failure("invalid", 400);
    }
    if (contentLength > maximumBytes) {
      return failure("too-large", 413);
    }
  }

  if (!request.body) return failure("invalid", 400);

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let byteLength = 0;
  let rawBody = "";
  const timeoutError = new Error("Request body timeout");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(timeoutError), maximumReadMs);
  });

  try {
    while (true) {
      const chunk = await Promise.race([reader.read(), deadline]);
      if (chunk.done) break;
      byteLength += chunk.value.byteLength;
      if (byteLength > maximumBytes) {
        void reader.cancel().catch(() => undefined);
        return failure("too-large", 413);
      }
      rawBody += decoder.decode(chunk.value, { stream: true });
    }
    rawBody += decoder.decode();
  } catch (error) {
    void reader.cancel().catch(() => undefined);
    return error === timeoutError ? failure("timeout", 408) : failure("invalid", 400);
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }

  try {
    return { ok: true, value: JSON.parse(rawBody) as unknown };
  } catch {
    return failure("invalid", 400);
  }
}

export function isRecordWithOnlyKeys(
  value: unknown,
  allowedKeys: readonly string[],
): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => allowedKeys.includes(key));
}
