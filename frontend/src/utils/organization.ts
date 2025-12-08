/**
 * Organization utilities - simplified for local development
 */

export function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;

  // For local development, use env variable or localStorage
  const devOrg = process.env.NEXT_PUBLIC_DEV_ORG || localStorage.getItem('dev_subdomain');
  if (devOrg) return devOrg;

  const hostname = window.location.hostname;

  // Skip localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

export function getOrganizationName(): string {
  const subdomain = getSubdomain();
  if (!subdomain) return 'ABC'; // Default for local dev
  return subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
}
