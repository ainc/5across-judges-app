import { NextResponse } from "next/server";

// Dev (http) stores authjs.session-token. Live and demo (https) store
// __Secure-authjs.session-token. Expire both so a sign-out always matches
// the cookie that was actually set.
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

const OTHER_COOKIE_NAMES = [
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
];

function expiredCookie(name: string) {
  const secure = name.startsWith("__Secure-") || name.startsWith("__Host-");
  return [
    `${name}=`,
    "Path=/",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);

  for (const name of SESSION_COOKIE_NAMES) {
    for (const cookieName of [name, `${name}.0`, `${name}.1`, `${name}.2`]) {
      response.headers.append("Set-Cookie", expiredCookie(cookieName));
    }
  }

  for (const name of OTHER_COOKIE_NAMES) {
    response.headers.append("Set-Cookie", expiredCookie(name));
  }

  return response;
}
