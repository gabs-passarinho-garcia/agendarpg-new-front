export interface ResponseModel<T> {
  statusCode: number;
  statusMessage?: string;
  /** @deprecated Typo kept for backward compatibility. */
  satusMessage?: string;
  data: T;
}
