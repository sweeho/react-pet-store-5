import { DOMParser, type Document } from "@xmldom/xmldom";

import { MalformedDocumentError } from "./errors";

/**
 * Well-formedness only (SWHR-R-0046.01) — schema validity is
 * `validateDocument`'s concern, not this function's. xmldom's default
 * `onError` logs every level to `console.error`; supplying our own keeps
 * that quiet and converts only `fatalError` (malformed XML) into a thrown
 * error, which xmldom wraps as `ParseError` and this function re-wraps as
 * `MalformedDocumentError`.
 */
export function parseDocument(xml: string): Document {
  let fatalMessage: string | null = null;
  const parser = new DOMParser({
    onError: (level, message) => {
      if (level === "fatalError") {
        fatalMessage = message;
        throw new Error(message);
      }
    },
  });

  try {
    const doc = parser.parseFromString(xml, "application/xml");
    if (!doc.documentElement) {
      throw new MalformedDocumentError(fatalMessage ?? "Document has no root element.");
    }
    return doc;
  } catch (error) {
    if (error instanceof MalformedDocumentError) {
      throw error;
    }
    const message = fatalMessage ?? (error instanceof Error ? error.message : String(error));
    throw new MalformedDocumentError(message);
  }
}
