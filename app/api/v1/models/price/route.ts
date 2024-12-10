import { NextRequest, NextResponse } from "next/server";
import { updateModelPrice } from "@/lib/db";

interface PriceUpdate {
  id: string;
  input_price: number;
  output_price: number;
  per_msg_price: number;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("收到的原始请求数据:", data);

    // 从对象中提取模型数组
    const updates = data.updates || data;
    if (!Array.isArray(updates)) {
      console.error("无效的数据格式 - 期望数组:", updates);
      return NextResponse.json({ error: "无效的数据格式" }, { status: 400 });
    }

    // 验证并转换数据格式
    const validUpdates = updates
      .map((update: any) => ({
        id: update.id,
        input_price: Number(update.input_price),
        output_price: Number(update.output_price),
        per_msg_price: Number(update.per_msg_price ?? -1),
      }))
      .filter((update: PriceUpdate) => {
        const isValidPrice = (price: number) =>
          !isNaN(price) && isFinite(price);

        if (
          !update.id ||
          !isValidPrice(update.input_price) ||
          !isValidPrice(update.output_price) ||
          !isValidPrice(update.per_msg_price)
        ) {
          console.log("跳过无效数据:", update);
          return false;
        }
        return true;
      });

    console.log("处理后的更新数据:", validUpdates);
    console.log(`成功验证 ${validUpdates.length} 个模型的价格更新请求`);

    // 执行批量更新并收集结果
    const results = await Promise.all(
      validUpdates.map(async (update: PriceUpdate) => {
        try {
          console.log("正在处理模型更新:", {
            id: update.id,
            input_price: update.input_price,
            output_price: update.output_price,
            per_msg_price: update.per_msg_price,
          });

          const result = await updateModelPrice(
            update.id,
            update.input_price,
            update.output_price,
            update.per_msg_price
          );

          console.log("更新结果:", {
            id: update.id,
            success: !!result,
            result,
          });

          return {
            id: update.id,
            success: !!result,
            data: result,
          };
        } catch (error) {
          console.error("更新失败:", {
            id: update.id,
            error: error instanceof Error ? error.message : "未知错误",
          });
          return {
            id: update.id,
            success: false,
            error: error instanceof Error ? error.message : "未知错误",
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    console.log(`成功更新 ${successCount} 个模型的价格`);

    return NextResponse.json({
      success: true,
      message: `成功更新 ${successCount} 个模型的价格`,
      results,
    });
  } catch (error) {
    console.error("批量更新失败:", error);
    return NextResponse.json({ error: "批量更新失败" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
