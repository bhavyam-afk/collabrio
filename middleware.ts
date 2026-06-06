import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add CSP headers to allow Razorpay
  response.headers.set(
    'Content-Security-Policy',
    `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://lumberjack.razorpay.com https://api.razorpay.com https://browser.sentry-cdn.com;
      connect-src 'self' https://checkout.razorpay.com https://cdn.razorpay.com https://lumberjack.razorpay.com https://api.razorpay.com https://browser.sentry-cdn.com;
      style-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com;
      img-src 'self' https: data:;
      font-src 'self' data: https://checkout.razorpay.com https://cdn.razorpay.com;
      frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com;
      frame-ancestors 'self';
    `.replace(/\s+/g, ' ')
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
