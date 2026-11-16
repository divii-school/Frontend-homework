/**
 * Sizes that must be numbers in TypeScript: next/image needs width and height, and the thumbnail box takes them
 * as an inline style. They are the only sizes outside styles/_variables.scss. LOGO is the image file's own size.
 */
export const LOGO = { src: "/assets/images/login-logo.png", width: 158, height: 30 } as const;
export const THUMBNAIL_SIZE = 60;
export const PREVIEW_SIZE = 120;
