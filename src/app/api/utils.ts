const resOk = <T>(data: T) => {
  return Response.json({
    error: null,
    data,
  });
};

const resErr = <T>(data: T, error: string) => {
  return Response.json({
    error: error,
    data,
  });
};

export function withHandler(handler: (...args: any[]) => Promise<any>) {
  return async (...args: any[]) => {
    try {
      const result = await handler(...args);
      return resOk(result);
    } catch (error: Error | any) {
      return resErr(null, error.message || 'An error occurred');
    }
  };
}

export { resOk, resErr };
