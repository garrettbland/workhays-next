import sanitizeHtml from "sanitize-html";

/**
 * The one HTML sanitizer for user-written rich text (job and employer descriptions, events).
 * Used when saving and again when rendering legacy content.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "div", "br", "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "a", "h2", "h3", "h4", "blockquote",
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      h1: "h2",
      a: sanitizeHtml.simpleTransform("a", { rel: "nofollow noopener noreferrer", target: "_blank" }),
    },
  }).trim();
}

/** Plain-text version for meta descriptions, emails, and spam checks. */
export function toPlainText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html.replace(/<(br|\/p|\/div|\/li)\s*\/?>/gi, " "), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
