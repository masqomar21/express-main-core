interface ResponseDataAttributes<T> {
  status: number;
  message: string | null;
  data?: T;
}

export function ResponseData<T>(
  status: number,
  message: string | null,
  data?: T
): ResponseDataAttributes<T> {
  return {
    status,
    message,
    data,
  };
}
