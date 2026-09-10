const internalOrigin = "https://easyqr.invalid";

function hasUnsafePathEncoding(value: string) {
  const path = value.split(/[?#]/, 1)[0];
  let decodedPath = path;

  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const decoded = decodeURIComponent(decodedPath);
      if (decoded === decodedPath) break;
      decodedPath = decoded;
    } catch {
      return true;
    }
  }

  return (
    decodedPath.startsWith("//") ||
    decodedPath.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(decodedPath)
  );
}

export function getSafeInternalPath(
  requestedPath: string | null | undefined,
  fallback: string,
) {
  if (
    !requestedPath ||
    !requestedPath.startsWith("/") ||
    hasUnsafePathEncoding(requestedPath)
  ) return fallback;

  try {
    const resolved = new URL(requestedPath, internalOrigin);
    if (resolved.origin !== internalOrigin || !resolved.pathname.startsWith("/")) {
      return fallback;
    }
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
