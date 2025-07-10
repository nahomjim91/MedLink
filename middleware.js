import createMiddleware from 'next-intl/middleware';
import {NextResponse} from 'next/server';

const locales = ['en', 'am', 'ti'];
const defaultLocale = 'en';

export default function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Only apply middleware to telehealth/patient routes
  if (pathname.startsWith('/telehealth/patient')) {
    // Check if pathname already has a locale
    const pathnameHasLocale = locales.some(
      locale => pathname.startsWith(`/telehealth/patient/${locale}`)
    );
    
    if (!pathnameHasLocale) {
      // Redirect to default locale
      const locale = defaultLocale;
      return NextResponse.redirect(
        new URL(`/telehealth/patient/${locale}${pathname.replace('/telehealth/patient', '')}`, request.url)
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/telehealth/patient/:path*']
};