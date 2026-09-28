export class MissingValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingValueError";
  }
}

export class MalformedDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MalformedDocumentError";
  }
}

export class DocumentReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentReadError";
  }
}
