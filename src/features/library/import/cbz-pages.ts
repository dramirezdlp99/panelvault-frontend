import { isImageName } from "./detect";

/** Ignora carpetas de sistema (__MACOSX) y archivos ocultos que algunos compresores agregan. */
export function isComicPage(path: string): boolean {
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  return !parts.includes("__MACOSX") && !name.startsWith(".") && isImageName(name);
}
