import { XMLSerializer, type Document, type Element } from "@xmldom/xmldom";

export interface DocTypeDecl {
  name: string;
  publicId: string;
  systemId: string;
}

const INDENT = "  ";
const serializer = new XMLSerializer();

/**
 * Writes `<?xml version="1.0" encoding="UTF-8"?>`, an optional DOCTYPE
 * (SWHR-R-0044's DTD-declared form), then the document indented two spaces
 * per level. xmldom's own XMLSerializer has no indentation option, so
 * structural (element-bearing) elements are opened/closed by hand and only
 * leaf elements (text-only or empty) are handed to XMLSerializer, which
 * already produces correctly escaped `<Tag>text</Tag>` / self-closed
 * `<Tag/>` output.
 */
export function serializeDocument(doc: Document, doctype?: DocTypeDecl): string {
  const root = doc.documentElement;
  if (!root) {
    throw new Error("Document has no root element.");
  }

  const parts = [`<?xml version="1.0" encoding="UTF-8"?>`];
  if (doctype) {
    parts.push(`<!DOCTYPE ${doctype.name} PUBLIC "${doctype.publicId}" "${doctype.systemId}">`);
  }
  parts.push(serializeElement(root, 0));
  return parts.join("\n") + "\n";
}

function serializeElement(el: Element, depth: number): string {
  const indent = INDENT.repeat(depth);
  const elementChildren = childElements(el);

  if (elementChildren.length === 0) {
    return `${indent}${serializer.serializeToString(el)}`;
  }

  const inner = elementChildren.map((child) => serializeElement(child, depth + 1)).join("\n");
  return `${indent}${openTag(el)}\n${inner}\n${indent}</${el.tagName}>`;
}

// A shallow clone carries the tag name and attributes but no children, so
// serializing it yields the self-closed open tag (`<Tag attr="x"/>`) with
// attribute values already correctly escaped; swapping the trailing `/>`
// for `>` turns it into the opening tag for the element's own children.
function openTag(el: Element): string {
  const clone = el.cloneNode(false) as Element;
  return serializer.serializeToString(clone).replace(/\/>$/, ">");
}

function childElements(el: Element): Element[] {
  const result: Element[] = [];
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === 1) {
      result.push(node as Element);
    }
  }
  return result;
}
