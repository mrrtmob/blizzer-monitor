import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { PoolClient } from "pg";

export async function GET(req: Request) {
  let client: PoolClient | null = null;
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const sortField = searchParams.get("sortField");
    const sortOrder = searchParams.get("sortOrder");
    const users = searchParams.get("users")?.split(",") || [];
    const models = searchParams.get("models")?.split(",") || [];

    client = await pool.connect();

    // 构建查询条件
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (users.length > 0) {
      conditions.push(`nickname = ANY($${paramIndex})`);
      params.push(users);
      paramIndex++;
    }

    if (models.length > 0) {
      conditions.push(`model_name = ANY($${paramIndex})`);
      params.push(models);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 构建排序
    const orderClause = sortField
      ? `ORDER BY ${sortField} ${sortOrder === "descend" ? "DESC" : "ASC"}`
      : "ORDER BY use_time DESC";

    // 获取总记录数
    const countQuery = `
      SELECT COUNT(*) 
      FROM user_usage_records 
      ${whereClause}
    `;
    const countResult = await client.query(countQuery, params);

    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const dataQuery = `
      SELECT 
        user_id,
        nickname,
        use_time,
        model_name,
        input_tokens,
        output_tokens,
        cost,
        balance_after
      FROM user_usage_records 
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...params, pageSize, offset];
    const records = await client.query(dataQuery, dataParams);

    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      records: records.rows,
      total,
    });
  } catch (error) {
    console.error("获取使用记录失败:", error);
    return NextResponse.json({ error: "获取使用记录失败" }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
