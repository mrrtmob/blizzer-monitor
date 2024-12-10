import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { PoolClient } from "pg";

export async function GET() {
  let client: PoolClient | null = null;

  try {
    // 获取数据库连接
    client = await pool.connect();

    // 获取所有表的数据
    const users = await client.query("SELECT * FROM users ORDER BY id");
    const modelPrices = await client.query(
      "SELECT * FROM model_prices ORDER BY id"
    );
    const records = await client.query(
      "SELECT * FROM user_usage_records ORDER BY id"
    );

    // 构建导出数据结构
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        users: users.rows,
        model_prices: modelPrices.rows,
        user_usage_records: records.rows,
      },
    };

    // 设置响应头
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set(
      "Content-Disposition",
      `attachment; filename=openwebui_monitor_backup_${
        new Date().toISOString().split("T")[0]
      }.json`
    );

    return new Response(JSON.stringify(exportData, null, 2), {
      headers,
    });
  } catch (error) {
    console.error("导出数据库失败:", error);
    return NextResponse.json({ error: "导出数据库失败" }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
