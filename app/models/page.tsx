"use client";

import { useState, useEffect } from "react";
import { Table, Input, message, Tooltip, Upload, Space } from "antd";
import {
  DownloadOutlined,
  ArrowLeftOutlined,
  ExperimentOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TestProgress } from "../../components/models/TestProgress";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface ModelResponse {
  id: string;
  name: string;
  imageUrl: string;
  input_price: number;
  output_price: number;
  per_msg_price: number;
}

interface Model {
  id: string;
  name: string;
  imageUrl: string;
  input_price: number;
  output_price: number;
  per_msg_price: number;
  testStatus?: "success" | "error" | "testing";
}

export default function ModelsPage() {
  const { t } = useTranslation("common");
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: "input_price" | "output_price" | "per_msg_price";
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showTestStatus, setShowTestStatus] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/v1/models");
        if (!response.ok) {
          throw new Error("获取模型失败");
        }
        const data = (await response.json()) as ModelResponse[];
        setModels(
          data.map((model: ModelResponse) => ({
            ...model,
            input_price: model.input_price ?? 60,
            output_price: model.output_price ?? 60,
            per_msg_price: model.per_msg_price ?? -1,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch("/api/config/key");
        if (!response.ok) {
          throw new Error(`获取 API Key 失败: ${response.status}`);
        }
        const data = await response.json();
        if (!data.apiKey) {
          throw new Error("API Key 未配置");
        }
        setApiKey(data.apiKey);
      } catch (error) {
        console.error("获取 API Key 失败:", error);
        message.error(
          error instanceof Error ? error.message : "获取 API Key 失败"
        );
      }
    };

    fetchApiKey();
  }, []);

  const handlePriceUpdate = async (
    id: string,
    field: "input_price" | "output_price" | "per_msg_price",
    value: number
  ) => {
    try {
      const model = models.find((m) => m.id === id);
      if (!model) return;

      const validValue = Number(value);
      if (
        field !== "per_msg_price" &&
        (!isFinite(validValue) || validValue < 0)
      ) {
        throw new Error("请输入有效的正数");
      }
      if (field === "per_msg_price" && !isFinite(validValue)) {
        throw new Error("请输入有效的数字");
      }

      const input_price =
        field === "input_price" ? validValue : model.input_price;
      const output_price =
        field === "output_price" ? validValue : model.output_price;
      const per_msg_price =
        field === "per_msg_price" ? validValue : model.per_msg_price;

      const response = await fetch("/api/v1/models/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            {
              id,
              input_price: Number(input_price),
              output_price: Number(output_price),
              per_msg_price: Number(per_msg_price),
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "更新价格失败");

      if (data.results && data.results[0]?.success) {
        setModels((prevModels) =>
          prevModels.map((model) =>
            model.id === id
              ? {
                  ...model,
                  input_price: Number(data.results[0].data.input_price),
                  output_price: Number(data.results[0].data.output_price),
                  per_msg_price: Number(data.results[0].data.per_msg_price),
                }
              : model
          )
        );
        message.success("价格更新成功");
      } else {
        throw new Error(data.results[0]?.error || "更新价格失败");
      }

      setEditingCell(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "更新价格失败");
      setEditingCell(null);
    }
  };

  const renderPriceCell = (
    field: "input_price" | "output_price" | "per_msg_price",
    record: Model
  ) => {
    const isEditing =
      editingCell?.id === record.id && editingCell?.field === field;
    const currentValue = Number(record[field]);

    return isEditing ? (
      <Input
        defaultValue={currentValue.toFixed(2)}
        className="w-28 sm:w-36"
        onPressEnter={(e: React.KeyboardEvent<HTMLInputElement>) => {
          const numValue = Number(e.currentTarget.value);
          if (
            field === "per_msg_price"
              ? isFinite(numValue)
              : isFinite(numValue) && numValue >= 0
          ) {
            handlePriceUpdate(record.id, field, numValue);
          } else {
            message.error(
              field === "per_msg_price"
                ? "请输入有效的数字"
                : "请输入有效的正数"
            );
            setEditingCell(null);
          }
        }}
        onBlur={(e) => {
          const value = e.target.value;
          const numValue = Number(value);
          if (
            value &&
            !isNaN(numValue) &&
            (field === "per_msg_price" ? isFinite(numValue) : numValue >= 0) &&
            numValue !== currentValue
          ) {
            handlePriceUpdate(record.id, field, numValue);
          } else {
            setEditingCell(null);
          }
        }}
        autoFocus
      />
    ) : (
      <div
        className="cursor-pointer font-medium text-blue-600"
        onClick={() => setEditingCell({ id: record.id, field })}
      >
        {currentValue < 0 ? (
          <span className="text-gray-400">{t("models.table.notSet")}</span>
        ) : (
          currentValue.toFixed(2)
        )}
      </div>
    );
  };

  const handleTestSingleModel = async (model: Model) => {
    try {
      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id ? { ...m, testStatus: "testing" } : m
        )
      );

      const result = await testModel(model);

      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id
            ? { ...m, testStatus: result.success ? "success" : "error" }
            : m
        )
      );
    } catch (error) {
      setModels((prev) =>
        prev.map((m) => (m.id === model.id ? { ...m, testStatus: "error" } : m))
      );
    }
  };

  const columns: ColumnsType<Model> = [
    {
      title: t("models.table.name"),
      key: "model",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-3 relative">
          <div
            className="relative cursor-pointer"
            onClick={() => handleTestSingleModel(record)}
          >
            {record.imageUrl && (
              <Image
                src={record.imageUrl}
                alt={record.name}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            )}
            {record.testStatus && (
              <div className="absolute -top-1 -right-1">
                {record.testStatus === "testing" && (
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  </div>
                )}
                {record.testStatus === "success" && (
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckOutlined className="text-[10px] text-green-500" />
                  </div>
                )}
                {record.testStatus === "error" && (
                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                    <CloseOutlined className="text-[10px] text-red-500" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="font-medium min-w-0 flex-1">
            <div className="truncate">{record.name}</div>
            <div className="text-xs text-gray-500 truncate opacity-60">
              {record.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t("models.table.inputPrice"),
      key: "input_price",
      width: 150,
      dataIndex: "input_price",
      sorter: (a, b) => a.input_price - b.input_price,
      sortDirections: ["descend", "ascend", "descend"],
      render: (_, record) => renderPriceCell("input_price", record),
    },
    {
      title: t("models.table.outputPrice"),
      key: "output_price",
      width: 150,
      dataIndex: "output_price",
      sorter: (a, b) => a.output_price - b.output_price,
      sortDirections: ["descend", "ascend", "descend"],
      render: (_, record) => renderPriceCell("output_price", record),
    },
    {
      title: (
        <span>
          {t("models.table.perMsgPrice")}{" "}
          <Tooltip title={t("models.table.perMsgPriceTooltip")}>
            <InfoCircleOutlined className="text-gray-400 cursor-help" />
          </Tooltip>
        </span>
      ),
      key: "per_msg_price",
      width: 150,
      dataIndex: "per_msg_price",
      sorter: (a, b) => a.per_msg_price - b.per_msg_price,
      sortDirections: ["descend", "ascend", "descend"],
      render: (_, record) => renderPriceCell("per_msg_price", record),
    },
  ];

  const handleExportPrices = () => {
    const priceData = models.map((model) => ({
      id: model.id,
      input_price: model.input_price,
      output_price: model.output_price,
      per_msg_price: model.per_msg_price,
    }));

    const blob = new Blob([JSON.stringify(priceData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model_prices_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportPrices = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        if (!Array.isArray(importedData)) {
          throw new Error("导入的数据格式不正确");
        }

        const validUpdates = importedData.filter((item) =>
          models.some((model) => model.id === item.id)
        );

        const response = await fetch("/api/v1/models/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: validUpdates,
          }),
        });

        if (!response.ok) {
          throw new Error("批量更新价格失败");
        }

        const data = await response.json();
        console.log("服务器返回的更新结果:", data);

        if (data.results) {
          setModels((prevModels) =>
            prevModels.map((model) => {
              const update = data.results.find(
                (r: any) => r.id === model.id && r.success && r.data
              );
              if (update) {
                return {
                  ...model,
                  input_price: Number(update.data.input_price),
                  output_price: Number(update.data.output_price),
                  per_msg_price: Number(update.data.per_msg_price),
                };
              }
              return model;
            })
          );
        }

        message.success(
          `成功更新 ${
            data.results.filter((r: any) => r.success).length
          } 个模型的价格`
        );
      } catch (err) {
        console.error("导入失败:", err);
        message.error(err instanceof Error ? err.message : "导入失败");
      }
    };
    reader.readAsText(file);
    return false;
  };

  const testModel = async (
    model: Model
  ): Promise<{
    id: string;
    success: boolean;
    error?: string;
  }> => {
    if (!apiKey) {
      return {
        id: model.id,
        success: false,
        error: "API Key 未获取",
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("/api/v1/models/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          modelId: model.id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "测试失败");
      }

      return {
        id: model.id,
        success: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        id: model.id,
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  };

  const handleTestModels = async () => {
    if (!apiKey) {
      message.error("API Key 未获取，无法进行测试");
      return;
    }

    try {
      setModels((prev) => prev.map((m) => ({ ...m, testStatus: "testing" })));
      setTesting(true);
      setIsTestComplete(false);

      const testPromises = models.map((model) =>
        testModel(model).then((result) => {
          setModels((prev) =>
            prev.map((m) =>
              m.id === model.id
                ? { ...m, testStatus: result.success ? "success" : "error" }
                : m
            )
          );
          return result;
        })
      );

      await Promise.all(testPromises);
      setIsTestComplete(true);
    } catch (error) {
      console.error("测试过程出错:", error);
      message.error("测试过程出错");
    } finally {
      setTesting(false);
    }
  };

  // 添加自定义渲染的卡片组件
  const MobileCard = ({ record }: { record: Model }) => {
    return (
      <div className="p-4 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="relative cursor-pointer"
            onClick={() => handleTestSingleModel(record)}
          >
            {record.imageUrl && (
              <Image
                src={record.imageUrl}
                alt={record.name}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            )}
            {record.testStatus && (
              <div className="absolute -top-1 -right-1">
                {record.testStatus === "testing" && (
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  </div>
                )}
                {record.testStatus === "success" && (
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckOutlined className="text-[10px] text-green-500" />
                  </div>
                )}
                {record.testStatus === "error" && (
                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                    <CloseOutlined className="text-[10px] text-red-500" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="font-medium min-w-0 flex-1">
            <div className="text-base truncate">{record.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {record.id}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-1.5">
              {t("models.table.mobile.inputPrice")}
            </span>
            <div className="w-full flex justify-center border rounded-md px-2 py-1.5">
              {renderPriceCell("input_price", record)}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-1.5">
              {t("models.table.mobile.outputPrice")}
            </span>
            <div className="w-full flex justify-center border rounded-md px-2 py-1.5">
              {renderPriceCell("output_price", record)}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-1.5">
              {t("models.table.mobile.perMsgPrice")}
            </span>
            <div className="w-full flex justify-center border rounded-md px-2 py-1.5">
              {renderPriceCell("per_msg_price", record)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="pt-16 text-2xl font-semibold text-gray-900">
          {t("models.title")}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{t("models.description")}</p>
      </div>

      <AnimatePresence mode="wait">
        {(!testing || isTestComplete) && (
          <motion.div
            key="test-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <Button
              variant="default"
              size="sm"
              onClick={handleTestModels}
              className="relative"
            >
              <ExperimentOutlined className="mr-2 h-4 w-4" />
              {t("models.testAll")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <TestProgress
        isVisible={testing || isTestComplete}
        models={models}
        isComplete={isTestComplete}
      />

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 sm:flex-none sm:w-[120px]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPrices}
              className="w-full h-9"
            >
              <DownloadOutlined className="mr-2 h-4 w-4" />
              {t("models.exportConfig")}
            </Button>
          </div>

          <div className="flex-1 sm:flex-none sm:w-[120px]">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9"
              onClick={() => document.getElementById("import-input")?.click()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {t("models.importConfig")}
            </Button>
            <input
              id="import-input"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImportPrices(file);
                }
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <Table
          columns={columns}
          dataSource={models}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          className="bg-white rounded-lg shadow-sm 
            [&_.ant-table]:!border-b-0 
            [&_.ant-table-container]:!rounded-lg 
            [&_.ant-table-container]:!border-hidden
            [&_.ant-table-cell]:!border-gray-100 
            [&_.ant-table-thead_.ant-table-cell]:!bg-gray-50/80
            [&_.ant-table-thead_.ant-table-cell]:!text-gray-600
            [&_.ant-table-thead_.ant-table-cell]:!font-medium
            [&_.ant-table-row:hover>*]:!bg-blue-50/50
            [&_.ant-table-tbody_.ant-table-row]:!cursor-pointer
            [&_.ant-table-tbody_.ant-table-cell]:!py-4
            [&_.ant-table-column-sorter-up.active_.anticon]:!text-blue-500
            [&_.ant-table-column-sorter-down.active_.anticon]:!text-blue-500"
          scroll={{ x: 500 }}
        />
      </div>

      <div className="sm:hidden space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary animate-spin rounded-full"></div>
          </div>
        ) : (
          models.map((model) => <MobileCard key={model.id} record={model} />)
        )}
      </div>
    </div>
  );
}
