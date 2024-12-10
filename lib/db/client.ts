import {
  createClient,
  QueryResult as VercelQueryResult,
} from "@vercel/postgres";
import { Pool, PoolClient } from "pg";

const isVercel = process.env.VERCEL === "1";

// 为 Vercel 环境添加连接池
let vercelPool: {
  client: ReturnType<typeof createClient>;
  isConnected: boolean;
} | null = null;
let pgPool: Pool | null = null;

async function getVercelClient() {
  if (!vercelPool) {
    vercelPool = {
      client: createClient(),
      isConnected: false,
    };
  }

  // 如果还没连接，则建立连接
  if (!vercelPool.isConnected) {
    try {
      await vercelPool.client.connect();
      vercelPool.isConnected = true;
    } catch (error) {
      console.error("Vercel DB connection error:", error);
      throw error;
    }
  }

  return vercelPool.client;
}

function getClient() {
  if (isVercel) {
    return getVercelClient();
  } else {
    if (!pgPool) {
      const config = {
        host: process.env.POSTGRES_HOST || "db",
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE || "openwebui_monitor",
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

      if (process.env.POSTGRES_URL) {
        pgPool = new Pool({
          connectionString: process.env.POSTGRES_URL,
          ssl: {
            rejectUnauthorized: false,
          },
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });
      } else {
        pgPool = new Pool(config);
      }

      pgPool.on("error", (err) => {
        console.error("Unexpected error on idle client", err);
        process.exit(-1);
      });
    }
    return pgPool;
  }
}

// 定义一个通用的查询结果类型
type CommonQueryResult<T = any> = {
  rows: T[];
  rowCount: number;
};

// 导出一个通用的查询函数
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<CommonQueryResult<T>> {
  const client = await getClient();
  const startTime = Date.now();

  if (isVercel) {
    try {
      const result = await (client as ReturnType<typeof createClient>).query({
        text,
        values: params || [],
      });
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      console.error("[DB Query Error]", error);
      // 如果连接出错，重置连接状态
      if (vercelPool) {
        vercelPool.isConnected = false;
      }
      throw error;
    }
  } else {
    let pgClient;
    try {
      pgClient = await (client as Pool).connect();
      const result = await pgClient.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      console.error("[DB Query Error]", error);
      console.error(`Query text: ${text}`);
      console.error(`Query params:`, params);
      throw error;
    } finally {
      if (pgClient) {
        pgClient.release();
      }
    }
  }
}

// 确保在应用关闭时清理连接
if (typeof window === "undefined") {
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing database connections");
    if (pgPool) {
      await pgPool.end();
    }
    if (vercelPool?.client) {
      await vercelPool.client.end();
      vercelPool.isConnected = false;
    }
  });
}

export { getClient };
