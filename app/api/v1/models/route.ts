import { NextResponse } from "next/server";
import { ensureTablesExist, getOrCreateModelPrice } from "@/lib/db";
import { ModelPrice } from "@/lib/db";

interface ModelInfo {
  id: string;
  name: string;
  meta: {
    profile_image_url: string;
  };
}

interface ModelWithPrice {
  id: string;
  name: string;
  imageUrl: string;
  input_price: number;
  output_price: number;
  per_msg_price: number;
  updated_at: Date;
}

interface ModelResponse {
  data: {
    id: string;
    name: string;
    info: ModelInfo;
  }[];
}

export async function GET() {
  try {
    // 确保数据库已初始化
    await ensureTablesExist();
    // console.log("Database initialized, fetching models...");

    const domain = process.env.OPENWEBUI_DOMAIN;
    if (!domain) {
      throw new Error("OPENWEBUI_DOMAIN 环境变量未设置");
    }

    // 规范化 API URL
    const apiUrl = domain.replace(/\/+$/, "") + "/api/models";

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.OPENWEBUI_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("API response status:", response.status);
      console.error("API response text:", await response.text());
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    // 先获取响应文本以便调试
    const responseText = await response.text();
    // console.log("API response:", responseText);

    let data: ModelResponse;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      throw new Error("Invalid JSON response from API");
    }

    if (!data || !Array.isArray(data.data)) {
      console.error("Unexpected API response structure:", data);
      throw new Error("Unexpected API response structure");
    }

    // 获取所有模型的价格信息
    const modelsWithPrices = await Promise.all(
      data.data.map(async (item) => {
        const priceInfo = await getOrCreateModelPrice(
          String(item.id),
          String(item.name)
        );
        const model: ModelWithPrice = {
          id: priceInfo.id,
          name: priceInfo.name,
          imageUrl: item.info?.meta?.profile_image_url || "/static/favicon.png",
          input_price: priceInfo.input_price,
          output_price: priceInfo.output_price,
          per_msg_price: priceInfo.per_msg_price,
          updated_at: priceInfo.updated_at,
        };
        return model;
      })
    );

    // 过滤掉无效的模型
    const validModels = modelsWithPrices.filter(
      (model): model is NonNullable<typeof model> => model !== null
    );

    return NextResponse.json(validModels);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch models",
      },
      { status: 500 }
    );
  }
}

// 添加 inlet 端点
export async function POST(req: Request) {
  const data = await req.json();

  return new Response("Inlet placeholder response", {
    headers: { "Content-Type": "application/json" },
  });
}

// 添加 outlet 端点
export async function PUT(req: Request) {
  const data = await req.json();
  // console.log("Outlet received:", JSON.stringify(data, null, 2));

  return new Response("Outlet placeholder response", {
    headers: { "Content-Type": "application/json" },
  });
}
