"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiDatabase, FiUsers, FiBarChart2, FiGithub } from "react-icons/fi";
import { GithubOutlined, CloseOutlined } from "@ant-design/icons";
import { APP_VERSION } from "@/lib/version";
import { message } from "antd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation("common");
  const [isUpdateVisible, setIsUpdateVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/variantconst/openwebui-monitor/releases/latest"
        );
        const data = await response.json();
        const latestVer = data.tag_name;
        if (!latestVer) {
          return;
        }

        const currentVer = APP_VERSION.replace(/^v/, "");
        const newVer = latestVer.replace(/^v/, "");

        // 检查是否有更新且用户未禁用该版本的提示
        const ignoredVersion = localStorage.getItem("ignoredVersion");
        if (currentVer !== newVer && ignoredVersion !== latestVer) {
          setLatestVersion(latestVer);
          setIsUpdateVisible(true);
        }
      } catch (error) {
        console.error(t("header.messages.updateCheckFailed"), error);
      }
    };

    checkUpdate();
  }, [t]);

  const handleUpdate = () => {
    window.open(
      "https://github.com/VariantConst/OpenWebUI-Monitor/releases/latest",
      "_blank"
    );
    setIsUpdateVisible(false);
  };

  const handleIgnore = () => {
    localStorage.setItem("ignoredVersion", latestVersion);
    setIsUpdateVisible(false);
    message.success(t("update.ignore"));
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-white pt-16">
      {/* 背景装饰 */}
      <div className="absolute top-0 left-0 w-[45rem] h-[45rem] bg-blue-50/40 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-purple-50/30 rounded-full blur-3xl -z-10 animate-float-delay" />

      {/* 主要内容区域 */}
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-sm md:max-w-4xl mx-auto px-4 sm:px-6">
            {/* 标题区域 */}
            <div className="w-full space-y-6 sm:space-y-8 mb-8 sm:mb-12">
              <div className="text-center space-y-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent mb-2 sm:mb-3 tracking-tight">
                  {t("common.appName")}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto font-light">
                  {t("common.description")}
                </p>
              </div>
            </div>

            {/* 功能卡片区域 - 使用 shadcn Card 组件 */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/models" className="block group">
                <Card className="h-full transition-all duration-500 hover:scale-[1.02] hover:shadow-lg border-gray-100">
                  <div className="p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-3 bg-blue-50 rounded-xl mr-4 group-hover:bg-blue-100 transition-all duration-500">
                        <FiDatabase className="text-xl text-blue-600" />
                      </div>
                      <h2 className="text-lg font-medium text-gray-900">
                        {t("home.features.models.title")}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("home.features.models.description")}
                    </p>
                  </div>
                </Card>
              </Link>

              <Link href="/users" className="block group">
                <Card className="h-full transition-all duration-500 hover:scale-[1.02] hover:shadow-lg border-gray-100">
                  <div className="p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-3 bg-purple-50 rounded-xl mr-4 group-hover:bg-purple-100 transition-all duration-500">
                        <FiUsers className="text-xl text-purple-600" />
                      </div>
                      <h2 className="text-lg font-medium text-gray-900">
                        {t("home.features.users.title")}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("home.features.users.description")}
                    </p>
                  </div>
                </Card>
              </Link>

              <Link href="/panel" className="block group">
                <Card className="h-full transition-all duration-500 hover:scale-[1.02] hover:shadow-lg border-gray-100">
                  <div className="p-6">
                    <div className="flex items-center mb-3">
                      <div className="p-3 bg-green-50 rounded-xl mr-4 group-hover:bg-green-100 transition-all duration-500">
                        <FiBarChart2 className="text-xl text-green-600" />
                      </div>
                      <h2 className="text-lg font-medium text-gray-900">
                        {t("home.features.stats.title")}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("home.features.stats.description")}
                    </p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        {/* GitHub 页脚 */}
        <div className="w-full flex justify-center py-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-gray-400 hover:text-gray-600"
          >
            <a
              href="https://github.com/VariantConst/OpenWebUI-Monitor"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiGithub className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>

      {/* 更新提示框 - 简化为文本形式 */}
      {isUpdateVisible && (
        <div className="fixed bottom-4 right-4 animate-slide-up">
          <div className="bg-gray-50/90 backdrop-blur-sm text-xs rounded-lg shadow-sm border border-gray-100/50 py-2 px-3">
            <div className="flex items-center gap-3 text-gray-600">
              <span>
                {t("update.newVersion")} {latestVersion}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleIgnore}
                  className="hover:text-gray-900 transition-colors"
                >
                  {t("update.ignore")}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleUpdate}
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  {t("update.update")}
                </button>
              </div>
              <button
                onClick={() => setIsUpdateVisible(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <CloseOutlined className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
