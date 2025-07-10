// middleware.js (at root of your project)
import { NextResponse } from 'next/server';

const locales = ['en', 'am', 'ti'];
const defaultLocale = 'en';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Check if this is exactly '/telehealth/patient' (without trailing slash)
  if (pathname === '/telehealth/patient') {
    let locale = defaultLocale;
    
    // Check cookie first
    const cookieLocale = request.cookies.get('preferred-locale')?.value;
    if (cookieLocale && locales.includes(cookieLocale)) {
      locale = cookieLocale;
    } else {
      // Check Accept-Language header
      const acceptLanguage = request.headers.get('accept-language');
      if (acceptLanguage) {
        // Simple language detection
        if (acceptLanguage.includes('am')) locale = 'am';
        else if (acceptLanguage.includes('ti')) locale = 'ti';
      }
    }
    
    // Redirect to localized route (note: no trailing slash)
    const newPathname = `/telehealth/patient/${locale}`;
    return NextResponse.redirect(new URL(newPathname, request.url));
  }
  
  // Check if this is '/telehealth/patient/' (with trailing slash)
  if (pathname === '/telehealth/patient/') {
    let locale = defaultLocale;
    
    // Check cookie first
    const cookieLocale = request.cookies.get('preferred-locale')?.value;
    if (cookieLocale && locales.includes(cookieLocale)) {
      locale = cookieLocale;
    } else {
      // Check Accept-Language header
      const acceptLanguage = request.headers.get('accept-language');
      if (acceptLanguage) {
        if (acceptLanguage.includes('am')) locale = 'am';
        else if (acceptLanguage.includes('ti')) locale = 'ti';
      }
    }
    
    // Redirect to localized route (note: no trailing slash)
    const newPathname = `/telehealth/patient/${locale}`;
    return NextResponse.redirect(new URL(newPathname, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match exact patient routes that need locale redirection
    '/telehealth/patient',
    '/telehealth/patient/',
  ],
};