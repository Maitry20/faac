import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_KEY = 'faac_super_secret_jwt_key_32_bytes_min';

export async function middleware(request) {
  const token = request.cookies.get('faac_jwt_token')?.value;

  if (!token) {
    // No token found, redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET_KEY);
    await jwtVerify(token, secret);
    
    // Token is valid, allow request to proceed
    return NextResponse.next();
  } catch (error) {
    console.warn('Middleware JWT Verification Failed:', error);
    // Invalid token, redirect to home page and optionally clear the invalid cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('faac_jwt_token');
    return response;
  }
}

// Only run middleware on the dashboard route and its sub-routes
export const config = {
  matcher: ['/dashboard/:path*']
};
