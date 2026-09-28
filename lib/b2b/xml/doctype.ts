import type { Document } from "@xmldom/xmldom";

import { DocumentReadError } from "./errors";

/**
 * xmldom stores a parsed DOCTYPE's publicId/systemId verbatim, including
 * the surrounding quote characters from the PubidLiteral/SystemLiteral
 * grammar productions — comparisons against a bare identifier must strip
 * them first.
 */
export function unquoteDeclaredId(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * SWHR-R-0045: a document declaring no document type passes unchecked (the
 * legacy identity transformer drops DOCTYPE nodes, R4) — only a declared,
 * mismatched public identifier is rejected.
 */
export function checkDocumentType(doc: Document, expectedPublicId: string): void {
  const doctype = doc.doctype;
  if (!doctype) {
    return;
  }

  const publicId = unquoteDeclaredId(doctype.publicId);
  if (publicId !== expectedPublicId) {
    throw new DocumentReadError(`Document not of type ${expectedPublicId}.`);
  }
}
