export const wordCount = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;
