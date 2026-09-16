declare module 'papaparse' {
  type ParseResult<T> = {
    data: T[];
    meta: { fields?: string[] };
  };

  type ParseConfig<T> = {
    header?: boolean;
    skipEmptyLines?: boolean;
    complete?: (results: ParseResult<T>) => void | Promise<void>;
    error?: (error: Error) => void;
  };

  const Papa: {
    parse<T>(file: File, config: ParseConfig<T>): void;
  };

  export default Papa;
}
