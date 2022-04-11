export interface RouteParams {
  readonly path: Map<string, string>;
  readonly query: URLSearchParams;
  readonly hash: string;
}
