import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { PoolClient } from "pg";

export async function POST(req: Request) {
  let client: PoolClient | null = null;

  try {
    const data = await req.json();

    // 验证数据格式
    if (!data.version || !data.data) {
      throw new Error("无效的导入数据格式");
    }

    // 获取数据库连接
    client = await pool.connect();

    // 开启事务
    await client.query("BEGIN");

    try {
      // 清空现有数据
      await client.query("TRUNCATE TABLE user_usage_records CASCADE");
      await client.query("TRUNCATE TABLE model_prices CASCADE");
      await client.query("TRUNCATE TABLE users CASCADE");

      // 导入用户数据
      if (data.data.users?.length) {
        for (const user of data.data.users) {
          await client.query(
            `INSERT INTO users (id, email, name, role, balance)
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, user.email, user.name, user.role, user.balance]
          );
        }
      }

      // 导入模型价格
      if (data.data.model_prices?.length) {
        for (const price of data.data.model_prices) {
          await client.query(
            `INSERT INTO model_prices (id, name, input_price, output_price)
             VALUES ($1, $2, $3, $4)`,
            [price.id, price.name, price.input_price, price.output_price]
          );
        }
      }

      // 导入使用记录
      if (data.data.user_usage_records?.length) {
        for (const record of data.data.user_usage_records) {
          await client.query(
            `INSERT INTO user_usage_records (
              user_id, nickname, use_time, model_name, 
              input_tokens, output_tokens, cost, balance_after
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              record.user_id,
              record.nickname,
              record.use_time,
              record.model_name,
              record.input_tokens,
              record.output_tokens,
              record.cost,
              record.balance_after,
            ]
          );
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "数据导入成功",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("导入数据库失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "导入数据库失败",
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
