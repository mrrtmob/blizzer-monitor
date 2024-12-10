import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  const headersList = headers();
  const token = headersList.get("authorization")?.split(" ")[1];
  const expectedToken = process.env.ACCESS_TOKEN;

  if (!token || token !== expectedToken) {
    return NextResponse.json(
      {
        apiKey: "未授权",
        status: 401,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    apiKey: process.env.API_KEY || "未设置",
    status: 200,
  });
}
