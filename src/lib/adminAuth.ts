// Shared admin authorization check for protected route handlers.
// The admin panel sends the password verbatim in the Authorization header.
export function isAdminAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const adminPassword = process.env.ADMIN_PASSWORD || 'afetadmin2026';
  return !!authHeader && authHeader === adminPassword;
}
