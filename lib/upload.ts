const dataUrlMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type SupportedUploadMimeType = (typeof dataUrlMimeTypes)[number];

function hasSignature(bytes: Buffer, mimeType: SupportedUploadMimeType) {
  if (mimeType === "application/pdf") {
    return bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

export function isSupportedUploadMimeType(value: string): value is SupportedUploadMimeType {
  return dataUrlMimeTypes.includes(value as SupportedUploadMimeType);
}

export function isValidUploadedDataUrl(
  dataUrl: string,
  mimeType: SupportedUploadMimeType,
  maximumBytes: number,
) {
  const prefix = `data:${mimeType};base64,`;
  if (
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes <= 0 ||
    dataUrl.length <= prefix.length ||
    dataUrl.slice(0, prefix.length).toLowerCase() !== prefix
  ) return false;

  const encoded = dataUrl.slice(prefix.length);
  if (
    encoded.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)
  ) return false;

  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const decodedLength = (encoded.length / 4) * 3 - padding;
  if (decodedLength <= 0 || decodedLength > maximumBytes) return false;

  try {
    const bytes = Buffer.from(encoded, "base64");
    return bytes.length === decodedLength && hasSignature(bytes, mimeType);
  } catch {
    return false;
  }
}
