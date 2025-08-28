import { NextResponse } from 'next/server'

export function middleware(request) {
  // Allow all routes without authentication for now
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin-dashboard/:path*',
    '/client-dashboard/:path*',
    '/api/users/:path*',
    '/api/trades/:path*',
    '/api/nav/:path*'
  ]
}