"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import dayjs from "dayjs";
import type { TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import type { FilterValue } from "antd/es/table/interface";
import { message } from "antd";
import TimeRangeSelector, {
  TimeRangeType,
} from "@/components/panel/TimeRangeSelector";
import ModelDistributionChart from "@/components/panel/ModelDistributionChart";
import UserRankingChart from "@/components/panel/UserRankingChart";
import UsageRecordsTable from "@/components/panel/UsageRecordsTable";
import { useTranslation } from "react-i18next";

interface ModelUsage {
  model_name: string;
  total_cost: number;
  total_count: number;
}

interface UserUsage {
  nickname: string;
  total_cost: number;
  total_count: number;
}

interface UsageData {
  models: ModelUsage[];
  users: UserUsage[];
  timeRange: {
    minTime: string;
    maxTime: string;
  };
}

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
  sortOrder?: "ascend" | "descend" | undefined;
  filters?: Record<string, FilterValue | null>;
}

export default function PanelPage() {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData>({
    models: [],
    users: [],
    timeRange: {
      minTime: "",
      maxTime: "",
    },
  });
  const [pieMetric, setPieMetric] = useState<"cost" | "count">("cost");
  const [barMetric, setBarMetric] = useState<"cost" | "count">("cost");
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100]);
  const [availableTimeRange, setAvailableTimeRange] = useState<{
    minTime: Date;
    maxTime: Date;
  }>({
    minTime: new Date(),
    maxTime: new Date(),
  });
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    filters: {
      nickname: null,
      model_name: null,
    },
  });
  const [timeRangeType, setTimeRangeType] = useState<TimeRangeType>("all");

  const fetchUsageData = async (newTimeRange?: [number, number]) => {
    setLoading(true);
    try {
      const currentRange = newTimeRange || timeRange;
      const isFullRange = currentRange[0] === 0 && currentRange[1] === 100;

      let url = `/api/v1/panel/usage?t=${Date.now()}`;

      if (!isFullRange) {
        const totalHours = dayjs(availableTimeRange.maxTime).diff(
          availableTimeRange.minTime,
          "hour"
        );

        const startTime = dayjs(availableTimeRange.minTime)
          .add((currentRange[0] * totalHours) / 100, "hour")
          .startOf("hour")
          .toISOString();

        const endTime = dayjs(availableTimeRange.minTime)
          .add((currentRange[1] * totalHours) / 100, "hour")
          .endOf("hour")
          .toISOString();

        url += `&startTime=${startTime}&endTime=${endTime}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setUsageData(data);

      if (isFullRange) {
        setAvailableTimeRange({
          minTime: new Date(data.timeRange.minTime),
          maxTime: new Date(data.timeRange.maxTime),
        });
      }
    } catch (error) {
      console.error("获取使用数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (params: TableParams) => {
    setTableLoading(true);
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

      if (params.filters?.nickname && params.filters.nickname.length > 0) {
        searchParams.append("users", params.filters.nickname.join(","));
      }
      if (params.filters?.model_name && params.filters.model_name.length > 0) {
        searchParams.append("models", params.filters.model_name.join(","));
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
    } catch (error) {
      message.error("获取记录失败");
    } finally {
      setTableLoading(false);
    }
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<UsageRecord> | SorterResult<UsageRecord>[]
  ) => {
    const processedFilters = Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [
        key,
        Array.isArray(value) && value.length === 0 ? null : value,
      ])
    );

    const newParams: TableParams = {
      pagination,
      filters: processedFilters,
      sortField: Array.isArray(sorter) ? undefined : sorter.field?.toString(),
      sortOrder: Array.isArray(sorter)
        ? undefined
        : (sorter.order as "ascend" | "descend" | undefined),
    };
    setTableParams(newParams);
    fetchRecords(newParams);
  };

  useEffect(() => {
    fetchUsageData();
    fetchRecords(tableParams);
  }, []);

  const handleTimeRangeChange = (
    range: [number, number],
    type: TimeRangeType
  ) => {
    setTimeRange(range);
    setTimeRangeType(type);
    fetchUsageData(range);
  };

  return (
    <>
      <Head>
        <title>{t("panel.header")}</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6 sm:space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("panel.title")}
          </h1>

          <TimeRangeSelector
            timeRange={timeRange}
            timeRangeType={timeRangeType}
            availableTimeRange={availableTimeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
        </div>

        <ModelDistributionChart
          loading={loading}
          models={usageData.models}
          metric={pieMetric}
          onMetricChange={setPieMetric}
        />

        <UserRankingChart
          loading={loading}
          users={usageData.users}
          metric={barMetric}
          onMetricChange={setBarMetric}
        />

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("panel.usageDetails.title")}
          </h2>
          <UsageRecordsTable
            loading={tableLoading}
            records={records}
            tableParams={tableParams}
            models={usageData.models}
            users={usageData.users}
            onTableChange={handleTableChange}
          />
        </div>
      </div>
    </>
  );
}
