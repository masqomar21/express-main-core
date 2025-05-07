interface Meta {
  status: number;
  message: string | null;
  [key: string]: any;
}

interface ApiResponse<T> {
  meta: Meta;
  response?: T;
}

export function ResponseData<T>(
  status: number,
  message: string | null,
  response?: T,
  additionalMeta?: Record<string, any>
): ApiResponse<T> {
  return {
    meta: {
      status,
      message,
      ...additionalMeta
    },
    response,
  };
}