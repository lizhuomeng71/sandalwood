import { updateSession } from "@v1/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { response: updatedResponse, user } = await updateSession(request, response);

  // if (!request.nextUrl.pathname.endsWith("/signin") && !user) {
  //   return NextResponse.redirect(new URL("/signin", request.url));
  // }

  return updatedResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|api|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
