export function assetPath(filename) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/${filename}`;
}
