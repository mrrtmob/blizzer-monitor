import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_KEY = process.env.API_KEY;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只验证 inlet/outlet/test API 请求
  if (
    pathname.startsWith("/api/v1/inlet") ||
    pathname.startsWith("/api/v1/outlet") ||
    pathname.startsWith("/api/v1/models/test")
  ) {
    // API 请求验证
    if (!API_KEY) {
      console.error("未设置 API_KEY 环境变量");
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    const providedKey = authHeader?.replace("Bearer ", "");

    if (!providedKey || providedKey !== API_KEY) {
      console.log("API密钥无效");
      return NextResponse.json({ error: "无效的API密钥" }, { status: 401 });
    }

    return NextResponse.next();
  } else if (!pathname.startsWith("/api/")) {
    // 页面访问验证
    if (!ACCESS_TOKEN) {
      console.error("未设置 ACCESS_TOKEN 环境变量");
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }

    // 如果是令牌验证页面，直接允许访问
    if (pathname === "/token") {
      return NextResponse.next();
    }

    // 添加 no-store 和 no-cache 头，防止 Cloudflare 缓存
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } else if (pathname.startsWith("/api/config/key")) {
    // 确保这个路径不被中间件拦截
    return NextResponse.next();
  }

  return NextResponse.next();
}

// 配置中间件匹配的路由
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
