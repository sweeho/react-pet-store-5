export class Failure extends Error {
  readonly kind: string = "Failure";

  constructor(message?: string) {
    super(message);
    throw new Error("VortexNotImplemented");
  }
}

export class GeneralFailure extends Failure {}

export class MissingFormDataFailure extends GeneralFailure {
  readonly missing: string[];

  constructor(missing: string[]) {
    super();
    this.missing = missing;
  }
}

export class EmptyCartFailure extends Failure {}

export class DuplicateAccountFailure extends Failure {}
