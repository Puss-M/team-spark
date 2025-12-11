import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  const protectedRoutes = ['/'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname === route
  );

  // Skip middleware for login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // For protected routes, we'll let the client-side code handle the redirect
  // because we can't access localStorage from middleware (server-side)
  // The client-side code in page.tsx will check localStorage and redirect if needed

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
// export const config = {
//   matcher: '/about/:path*',
// };