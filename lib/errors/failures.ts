export class Failure extends Error {
  readonly kind: string = "Failure";

  constructor(message?: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class GeneralFailure extends Failure {
  override readonly kind: string = "General";
}

export class MissingFormDataFailure extends GeneralFailure {
  override readonly kind: string = "MissingFormData";
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Missing form data: ${missing.join(", ")}`);
    this.missing = missing;
  }
}

export class EmptyCartFailure extends Failure {
  override readonly kind: string = "EmptyCart";
}

export class DuplicateAccountFailure extends Failure {
  override readonly kind: string = "DuplicateAccount";
}
