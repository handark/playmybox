import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from "jose";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

export interface TokenPayload {
  sub: string;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as JoseJWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
  };
}

// Higher-order function for protected API routes
export function withAuth<T extends Record<string, unknown>>(
  handler: (
    request: Request,
    context: T,
    user: AuthUser
  ) => Promise<Response>
): (request: Request, context: T) => Promise<Response> {
  return async (request: Request, context: T) => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(request, context, user);
  };
}
