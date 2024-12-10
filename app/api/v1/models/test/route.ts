import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { modelId } = await req.json();

    if (!modelId) {
      return NextResponse.json({
        success: false,
        message: "模型ID不能为空",
      });
    }

    const domain = process.env.OPENWEBUI_DOMAIN;
    const apiKey = process.env.OPENWEBUI_API_KEY;

    if (!domain || !apiKey) {
      return NextResponse.json({
        success: false,
        message: "环境变量未正确配置",
      });
    }

    const apiUrl = domain.replace(/\/+$/, "") + "/api/chat/completions";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: "test, just say hi",
          },
        ],
      }),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({
        success: false,
        message: `解析响应失败: ${responseText}`,
      });
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message:
          data.error ||
          `API请求失败: ${response.status} ${response.statusText}`,
      });
    }

    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json({
        success: false,
        message: "响应格式不正确",
      });
    }

    return NextResponse.json({
      success: true,
      message: "测试成功",
      response: data.choices[0].message.content,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "未知错误",
    });
  }
}
