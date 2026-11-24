/**
 * The OAuth redirect (app.tab.aid:/oauth2redirect) is consumed by the auth
 * session browser. If it ever reaches the router, send it home instead of
 * showing an unmatched-route screen.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return path.includes('oauth2redirect') ? '/' : path;
}
