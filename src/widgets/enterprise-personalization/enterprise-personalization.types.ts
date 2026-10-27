export type BrandLogoState =
  | { kind: 'remote'; url: string }
  | { kind: 'local'; blob: Blob; mimeType: string; previewUrl: string }
  | null
