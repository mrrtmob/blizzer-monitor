import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    const timeFilter =
      startTime && endTime ? `WHERE use_time >= $1 AND use_time <= $2` : "";

    const params = startTime && endTime ? [startTime, endTime] : [];

    const [modelResult, userResult, timeRangeResult] = await Promise.all([
      pool.query(
        `
        SELECT 
          model_name,
          COUNT(*) as total_count,
          COALESCE(SUM(cost), 0) as total_cost
        FROM user_usage_records
        ${timeFilter}
        GROUP BY model_name
        ORDER BY total_cost DESC
      `,
        params
      ),
      pool.query(
        `
        SELECT 
          nickname,
          COUNT(*) as total_count,
          COALESCE(SUM(cost), 0) as total_cost
        FROM user_usage_records
        ${timeFilter}
        GROUP BY nickname
        ORDER BY total_cost DESC
      `,
        params
      ),
      pool.query(`
        SELECT 
          MIN(use_time) as min_time,
          MAX(use_time) as max_time
        FROM user_usage_records
      `),
    ]);

    const formattedData = {
      models: modelResult.rows.map((row) => ({
        model_name: row.model_name,
        total_count: parseInt(row.total_count),
        total_cost: parseFloat(row.total_cost),
      })),
      users: userResult.rows.map((row) => ({
        nickname: row.nickname,
        total_count: parseInt(row.total_count),
        total_cost: parseFloat(row.total_cost),
      })),
      timeRange: {
        minTime: timeRangeResult.rows[0].min_time,
        maxTime: timeRangeResult.rows[0].max_time,
      },
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("获取使用统计失败:", error);
    return NextResponse.json({ error: "获取使用统计失败" }, { status: 500 });
  }
}
