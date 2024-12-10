import { query } from "@/lib/db/client";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { balance } = await req.json();
    const userId = params.id;

    if (typeof balance !== "number") {
      return NextResponse.json({ error: "余额必须是数字" }, { status: 400 });
    }

    const result = await query(
      `UPDATE users
       SET balance = $1
       WHERE id = $2
       RETURNING id, email, balance`,
      [balance, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("更新用户余额失败:", error);
    return NextResponse.json({ error: "更新用户余额失败" }, { status: 500 });
  }
}
