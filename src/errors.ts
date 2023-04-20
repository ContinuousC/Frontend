/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

export class InvalidISODate extends Error {
  constructor() {
    super();
    this.name = "InvalidISODate";
  }
}

export class TimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeError";
  }
}

export class InvalidDuration extends Error {
  constructor() {
    super();
    this.name = "InvalidDuration";
  }
}

export class InvalidInterval extends Error {
  constructor() {
    super();
    this.name = "InvalidInterval";
  }
}

export class NotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplemented";
  }
}

export class LogicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LogicError";
  }
}
