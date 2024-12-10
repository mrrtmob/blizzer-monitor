"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Button as ShadcnButton } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
export type TimeRangeType =
  | "today"
  | "week"
  | "month"
  | "30days"
  | "all"
  | "custom";

interface TimeRangeSelectorProps {
  timeRange: [number, number];
  timeRangeType: TimeRangeType;
  availableTimeRange: {
    minTime: Date;
    maxTime: Date;
  };
  onTimeRangeChange: (range: [number, number], type: TimeRangeType) => void;
}

const calculateTimeRange = (
  type: TimeRangeType,
  availableTimeRange: { minTime: Date; maxTime: Date }
): [number, number] => {
  if (type === "all") return [0, 100];

  const now = dayjs();
  let startTime: dayjs.Dayjs;
  let endTime = now;

  switch (type) {
    case "today":
      startTime = now.startOf("day");
      break;
    case "week":
      startTime = now.startOf("week");
      break;
    case "month":
      startTime = now.startOf("month");
      break;
    case "30days":
      startTime = now.subtract(30, "day");
      break;
    default:
      return [0, 100];
  }

  const totalHours = dayjs(availableTimeRange.maxTime).diff(
    availableTimeRange.minTime,
    "hour"
  );
  const startPercentage = Math.max(
    0,
    (startTime.diff(availableTimeRange.minTime, "hour") / totalHours) * 100
  );
  const endPercentage = Math.min(
    100,
    (endTime.diff(availableTimeRange.minTime, "hour") / totalHours) * 100
  );

  return [startPercentage, endPercentage];
};

const checkTimeRangeType = (
  startTime: dayjs.Dayjs,
  endTime: dayjs.Dayjs,
  availableTimeRange: { minTime: Date; maxTime: Date }
): TimeRangeType => {
  if (
    dayjs(startTime).isSame(availableTimeRange.minTime, "hour") &&
    dayjs(endTime).isSame(availableTimeRange.maxTime, "hour")
  ) {
    return "all";
  }

  const now = dayjs();
  const isToday = startTime.isSame(now.startOf("day")) && endTime.isSame(now);
  const isWeek = startTime.isSame(now.startOf("week")) && endTime.isSame(now);
  const isMonth = startTime.isSame(now.startOf("month")) && endTime.isSame(now);
  const is30Days =
    startTime.isSame(now.subtract(30, "day"), "hour") && endTime.isSame(now);

  if (isToday) return "today";
  if (isWeek) return "week";
  if (isMonth) return "month";
  if (is30Days) return "30days";

  return "custom";
};

export default function TimeRangeSelector({
  timeRange,
  timeRangeType,
  availableTimeRange,
  onTimeRangeChange,
}: TimeRangeSelectorProps) {
  const { t } = useTranslation("common");
  const totalHours = dayjs(availableTimeRange.maxTime).diff(
    availableTimeRange.minTime,
    "hour"
  );

  const startTime = dayjs(availableTimeRange.minTime).add(
    (timeRange[0] * totalHours) / 100,
    "hour"
  );
  const endTime = dayjs(availableTimeRange.minTime).add(
    (timeRange[1] * totalHours) / 100,
    "hour"
  );

  const handleTimeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    if (!dates) return;
    const [start, end] = dates;

    const startPercentage = Math.max(
      0,
      (start.diff(availableTimeRange.minTime, "hour") / totalHours) * 100
    );
    const endPercentage = Math.min(
      100,
      (end.diff(availableTimeRange.minTime, "hour") / totalHours) * 100
    );

    const newType = checkTimeRangeType(start, end, availableTimeRange);
    onTimeRangeChange([startPercentage, endPercentage], newType);
  };

  return (
    <div className="pb-8">
      <div className="w-full">
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">
            {t("panel.timeRange.title")}
          </span>

          <DatePicker.RangePicker
            showTime={{ format: "HH:00" }}
            format="YYYY-MM-DD HH:00"
            value={[startTime, endTime]}
            onChange={(dates) =>
              handleTimeChange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
            disabledDate={(current) => {
              return (
                current < dayjs(availableTimeRange.minTime) ||
                current > dayjs(availableTimeRange.maxTime)
              );
            }}
            className="w-full"
          />

          <div className="grid grid-cols-5 gap-2">
            {[
              { type: "today", label: t("panel.timeRange.timeOptions.day") },
              { type: "week", label: t("panel.timeRange.timeOptions.week") },
              { type: "month", label: t("panel.timeRange.timeOptions.month") },
              {
                type: "30days",
                label: t("panel.timeRange.timeOptions.30Days"),
              },
              { type: "all", label: t("panel.timeRange.timeOptions.all") },
            ].map(({ type, label }) => (
              <ShadcnButton
                key={type}
                variant={timeRangeType === type ? "default" : "outline"}
                size="sm"
                className="w-full transition-all duration-300 hover:scale-105"
                onClick={() => {
                  const newRange = calculateTimeRange(
                    type as TimeRangeType,
                    availableTimeRange
                  );
                  onTimeRangeChange(newRange, type as TimeRangeType);
                }}
              >
                {label}
              </ShadcnButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
