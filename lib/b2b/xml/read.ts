import type { Element } from "@xmldom/xmldom";

import { DocumentReadError } from "./errors";

export function expectRoot(el: Element, name: string, namespace?: string): void {
  const namespaceMatches = namespace === undefined || el.namespaceURI === namespace;
  if (el.localName !== name || !namespaceMatches) {
    throw new DocumentReadError(`${name} element expected.`);
  }
}

/**
 * Reads a parent's element children positionally, the shape every document
 * reader in this capability is built from (SWHR-R-0027.03 "elements out of
 * order" and friends). Text and comment children (e.g. the indentation
 * whitespace `serializeDocument` writes) are skipped entirely — only
 * `nodeType === 1` (ELEMENT_NODE) children hold a position.
 */
export class ChildReader {
  private readonly children: Element[];
  private index = 0;

  constructor(parent: Element) {
    this.children = [];
    for (let i = 0; i < parent.childNodes.length; i++) {
      const node = parent.childNodes[i];
      if (node.nodeType === 1) {
        this.children.push(node as Element);
      }
    }
  }

  text(name: string, opts?: { allowEmpty?: boolean }): string {
    const el = this.element(name);
    const content = el.textContent ?? "";
    if (content === "" && !opts?.allowEmpty) {
      throw new DocumentReadError(`${name} element: content expected.`);
    }
    return content;
  }

  optionalText(name: string): string | null {
    const next = this.children[this.index];
    if (!next || next.localName !== name) {
      return null;
    }
    this.index++;
    return next.textContent ?? "";
  }

  element(name: string): Element {
    const next = this.children[this.index];
    if (!next || next.localName !== name) {
      throw new DocumentReadError(`${name} element expected.`);
    }
    this.index++;
    return next;
  }

  elements(name: string, min = 0): Element[] {
    const result: Element[] = [];
    while (this.children[this.index]?.localName === name) {
      result.push(this.children[this.index]);
      this.index++;
    }
    if (result.length < min) {
      throw new DocumentReadError(`${name} element expected.`);
    }
    return result;
  }

  end(): void {
    const next = this.children[this.index];
    if (next) {
      throw new DocumentReadError(`Unexpected element: ${next.localName}.`);
    }
  }
}
