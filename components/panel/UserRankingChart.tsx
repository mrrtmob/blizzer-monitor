"use client";

import { useRef, useEffect } from "react";
import { Spin } from "antd";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import { MetricSwitch } from "@/components/ui/metric-switch";
import { useTranslation } from "react-i18next";
interface UserUsage {
  nickname: string;
  total_cost: number;
  total_count: number;
}

interface UserRankingChartProps {
  loading: boolean;
  users: UserUsage[];
  metric: "cost" | "count";
  onMetricChange: (metric: "cost" | "count") => void;
}

const getBarOption = (
  users: UserUsage[],
  metric: "cost" | "count",
  t: (key: string) => string
) => {
  const columnData = users
    .map((item) => ({
      nickname: item.nickname,
      value: metric === "cost" ? Number(item.total_cost) : item.total_count,
    }))
    .sort((a, b) => b.value - a.value);

  const isSmallScreen = window.innerWidth < 640;

  return {
    tooltip: {
      show: false,
    },
    grid: {
      top: isSmallScreen ? "12%" : "8%",
      bottom: "12%",
      left: "3%",
      right: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: columnData.map((item) =>
        item.nickname.length > 15
          ? item.nickname.slice(0, 12) + "..."
          : item.nickname
      ),
      axisLabel: {
        inside: false,
        color: "#666",
        fontSize: 12,
        rotate: 45,
        interval: "auto",
        hideOverlap: true,
      },
      axisTick: {
        show: false,
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#ddd",
        },
      },
      z: 10,
    },
    yAxis: {
      type: "value",
      name:
        metric === "cost"
          ? t("panel.userUsageChart.yaxis.byAmount")
          : t("panel.userUsageChart.yaxis.byCount"),
      nameTextStyle: {
        color: "#666",
        padding: isSmallScreen ? [0, 0, 8, 0] : [30, 0, 8, 0],
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#ddd",
        },
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: "#ddd",
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#f5f5f5",
          type: "dashed",
        },
      },
      axisLabel: {
        color: "#999",
        formatter: (value: number) => {
          if (metric === "cost") {
            return `${t("common.currency")}${value.toFixed(1)}`;
          }
          return value;
        },
      },
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: Math.min(100, Math.max(100 * (15 / columnData.length), 30)),
        zoomLock: true,
        moveOnMouseMove: true,
      },
    ],
    series: [
      {
        type: "bar",
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "#8BA3C7",
              },
              {
                offset: 1,
                color: "#4A6288",
              },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "#7691B8",
                },
                {
                  offset: 1,
                  color: "#385278",
                },
              ],
            },
          },
        },
        barWidth: "60%",
        data: columnData.map((item) => item.value),
        showBackground: true,
        backgroundStyle: {
          color: "rgba(180, 180, 180, 0.1)",
          borderRadius: [6, 6, 0, 0],
        },
        label: {
          show: !isSmallScreen,
          position: "top",
          formatter: (params: any) => {
            return metric === "cost"
              ? `${t("common.currency")}${params.value.toFixed(2)}`
              : `${params.value}`;
          },
          fontSize: 11,
          color: "#666",
          distance: 6,
        },
      },
    ],
    animation: true,
    animationDuration: 1500,
    animationEasing: "elasticOut" as const,
  };
};

export default function UserRankingChart({
  loading,
  users,
  metric,
  onMetricChange,
}: UserRankingChartProps) {
  const { t } = useTranslation("common");
  const chartRef = useRef<ECharts>();

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize();
        chartRef.current.setOption(getBarOption(users, metric, t));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [metric, users, t]);

  const onChartReady = (instance: ECharts) => {
    chartRef.current = instance;
    const zoomSize = 6;
    let isZoomed = false; // 增加一个状态变量

    instance.on("click", (params) => {
      const dataLength = users.length;

      if (!isZoomed) {
        // 第一次点击，放大区域
        instance.dispatchAction({
          type: "dataZoom",
          startValue:
            users[Math.max(params.dataIndex - zoomSize / 2, 0)].nickname,
          endValue:
            users[Math.min(params.dataIndex + zoomSize / 2, dataLength - 1)]
              .nickname,
        });
        isZoomed = true;
      } else {
        // 第二次点击，还原缩放
        instance.dispatchAction({
          type: "dataZoom",
          start: 0,
          end: 100,
        });
        isZoomed = false;
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("panel.userUsageChart.title")}
        </h2>
        <MetricSwitch value={metric} onChange={onMetricChange} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center sm:h-[600px] h-[400px]">
          <Spin size="large" />
        </div>
      ) : (
        <div className="sm:h-[650px] h-[400px]">
          <ReactECharts
            option={getBarOption(users, metric, t)}
            style={{ height: "100%", width: "100%" }}
            onChartReady={onChartReady}
            className="bar-chart"
          />
        </div>
      )}
    </div>
  );
}
