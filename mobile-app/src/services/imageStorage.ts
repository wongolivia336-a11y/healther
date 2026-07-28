import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

const REFERENCE_PREFIX = "healther-file://";
const REPORT_DIRECTORY = "reports";

export function isStoredFileReference(value: string): boolean {
  return value.startsWith(REFERENCE_PREFIX);
}

export async function persistImageDataUrl(dataUrl: string): Promise<string> {
  if (!Capacitor.isNativePlatform()) return dataUrl;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid image data");
  const path = `${REPORT_DIRECTORY}/${crypto.randomUUID()}.jpg`;
  try {
    await Filesystem.mkdir({ path: REPORT_DIRECTORY, directory: Directory.Data, recursive: true });
  } catch {
    // The directory already exists.
  }
  await Filesystem.writeFile({
    path,
    data: dataUrl.slice(comma + 1),
    directory: Directory.Data,
    recursive: true
  });
  return `${REFERENCE_PREFIX}${path}`;
}

export async function resolveImageReference(reference: string): Promise<string> {
  if (!isStoredFileReference(reference)) return reference;
  const path = reference.slice(REFERENCE_PREFIX.length);
  const result = await Filesystem.getUri({ path, directory: Directory.Data });
  return Capacitor.convertFileSrc(result.uri);
}

export async function deleteStoredImages(references: string[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await Promise.allSettled(references.filter(isStoredFileReference).map(reference =>
    Filesystem.deleteFile({
      path: reference.slice(REFERENCE_PREFIX.length),
      directory: Directory.Data
    })
  ));
}
