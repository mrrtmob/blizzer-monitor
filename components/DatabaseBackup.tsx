"use client";

import { useRef } from "react";
import { message } from "antd";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DatabaseIcon, DownloadIcon, UploadIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DatabaseBackupProps {
  open: boolean;
  onClose: () => void;
  token?: string;
}

export default function DatabaseBackup({
  open,
  onClose,
  token,
}: DatabaseBackupProps) {
  const { t } = useTranslation("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!token) {
      message.error(t("auth.unauthorized"));
      return;
    }

    try {
      const response = await fetch("/api/v1/panel/database/export", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t("backup.export.error"));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `openwebui_monitor_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success(t("backup.export.success"));
    } catch (error) {
      console.error(t("backup.export.error"), error);
      message.error(t("backup.export.error"));
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      message.error(t("auth.unauthorized"));
      return;
    }

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      const response = await fetch("/api/v1/panel/database/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(t("backup.import.error"));
      }

      const result = await response.json();

      if (result.success) {
        message.success(t("backup.import.success"));
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error(result.error || t("backup.import.error"));
      }
    } catch (err) {
      console.error(t("backup.import.error"), err);
      message.error(
        err instanceof Error ? err.message : t("backup.import.error")
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] !max-w-[400px] rounded-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
              <DatabaseIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <DialogTitle className="text-base sm:text-lg">
              {t("backup.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm">
            {t("backup.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 py-3 sm:py-4">
          <Card
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent",
              "group relative overflow-hidden"
            )}
            onClick={handleExport}
          >
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20">
                <DownloadIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="font-medium leading-none text-sm sm:text-base">
                  {t("backup.export.title")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("backup.export.description")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent",
              "group relative overflow-hidden"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20">
                <UploadIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="font-medium leading-none text-sm sm:text-base">
                  {t("backup.import.title")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("backup.import.description")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
