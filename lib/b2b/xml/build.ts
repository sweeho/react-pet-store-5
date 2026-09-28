import { DOMImplementation, type Document, type Element } from "@xmldom/xmldom";

import { MissingValueError } from "./errors";

const implementation = new DOMImplementation();

export function createDocument(rootName: string, namespace?: string): Document {
  return implementation.createDocument(namespace ?? null, rootName, null);
}

/**
 * Appends a text-content child element. `value` distinguishes a programming
 * error (null/undefined — the caller forgot to supply a value it owed the
 * document) from an intentionally empty element ("" — e.g. an absent
 * optional field that the wire format still requires present, per
 * design.md P9's "every other child SHALL always be emitted, as an empty
 * element when its value is absent").
 */
export function appendTextElement(
  parent: Element,
  name: string,
  value: string | null | undefined,
  namespace?: string,
): Element {
  if (value === null || value === undefined) {
    throw new MissingValueError(`${name} value is required.`);
  }

  const doc = parent.ownerDocument;
  if (!doc) {
    throw new Error(`${name}: parent element has no owner document.`);
  }
  const element = namespace ? doc.createElementNS(namespace, name) : doc.createElement(name);
  if (value !== "") {
    element.appendChild(doc.createTextNode(value));
  }
  parent.appendChild(element);
  return element;
}
