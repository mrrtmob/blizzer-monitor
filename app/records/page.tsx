"use client";

import { useState, useEffect } from "react";
import { Table, Button, message, DatePicker, Select, Space } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import zhCN from "antd/lib/locale/zh_CN";
import React from "react";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;

interface UsageRecord {
  id: number;
  nickname: string;
  use_time: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  balance_after: number;
}

interface TableParams {
  pagination: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
  dateRange?: RangePickerProps["value"];
}

export default function RecordsPage() {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

  const columns: ColumnsType<UsageRecord> = [
    {
      title: "用户",
      dataIndex: "nickname",
      key: "nickname",
      filters: users.map((user) => ({ text: user, value: user })),
      filterMode: "tree",
      filterSearch: true,
    },
    {
      title: "使用时间",
      dataIndex: "use_time",
      key: "use_time",
      render: (text) => new Date(text).toLocaleString(),
      sorter: true,
    },
    {
      title: "模型",
      dataIndex: "model_name",
      key: "model_name",
      filters: models.map((model) => ({ text: model, value: model })),
      filterMode: "tree",
      filterSearch: true,
    },
    {
      title: "输入tokens",
      dataIndex: "input_tokens",
      key: "input_tokens",
      align: "right",
      sorter: true,
    },
    {
      title: "输出tokens",
      dataIndex: "output_tokens",
      key: "output_tokens",
      align: "right",
      sorter: true,
    },
    {
      title: "消耗金额",
      dataIndex: "cost",
      key: "cost",
      align: "right",
      render: (value) => `${t("common.currency")}${Number(value).toFixed(4)}`,
      sorter: true,
    },
    {
      title: "剩余余额",
      dataIndex: "balance_after",
      key: "balance_after",
      align: "right",
      render: (value) => `${t("common.currency")}${Number(value).toFixed(4)}`,
      sorter: true,
    },
  ];

  const fetchRecords = async (params: TableParams) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.append("page", params.pagination.current?.toString() || "1");
      searchParams.append(
        "pageSize",
        params.pagination.pageSize?.toString() || "10"
      );

      if (params.sortField) {
        searchParams.append("sortField", params.sortField);
        searchParams.append("sortOrder", params.sortOrder || "ascend");
      }

      if (params.dateRange) {
        const [start, end] = params.dateRange;
        if (start && end) {
          searchParams.append("startDate", start.format("YYYY-MM-DD"));
          searchParams.append("endDate", end.format("YYYY-MM-DD"));
        }
      }

      if (params.filters) {
        if (params.filters.nickname) {
          searchParams.append("user", params.filters.nickname[0] as string);
        }
        if (params.filters.model_name) {
          searchParams.append("model", params.filters.model_name[0] as string);
        }
      }

      const response = await fetch(
        `/api/v1/panel/records?${searchParams.toString()}`
      );
      const data = await response.json();

      setRecords(data.records);
      setTableParams({
        ...params,
        pagination: {
          ...params.pagination,
          total: data.total,
        },
      });

      // 设置筛选选项
      setUsers(data.users as string[]);
      setModels(data.models as string[]);
    } catch (error) {
      message.error("获取记录失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(tableParams);
  }, []);

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<UsageRecord> | SorterResult<UsageRecord>[]
  ) => {
    const newParams: TableParams = {
      pagination,
      filters,
      sortField: Array.isArray(sorter) ? undefined : sorter.field?.toString(),
      sortOrder: Array.isArray(sorter)
        ? undefined
        : sorter.order === null
        ? undefined
        : sorter.order,
      dateRange: tableParams.dateRange,
    };
    setTableParams(newParams);
    fetchRecords(newParams);
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/v1/panel/records/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `usage_records_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      message.error("导出失败");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">使用记录</h1>
        <div className="flex justify-between items-center mb-4">
          <Space size="middle">
            <RangePicker
              locale={zhCN.DatePicker}
              onChange={(dates) => {
                const newParams = {
                  ...tableParams,
                  dateRange: dates,
                  pagination: { ...tableParams.pagination, current: 1 },
                };
                setTableParams(newParams);
                fetchRecords(newParams);
              }}
            />
          </Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出记录
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
}
