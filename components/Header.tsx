"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Dropdown, Modal, message } from "antd";
import type { MenuProps } from "antd";
import { Copy, LogOut, Database, Github, Menu, Globe } from "lucide-react";
import DatabaseBackup from "./DatabaseBackup";
import { APP_VERSION } from "@/lib/version";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Header() {
  const { t, i18n } = useTranslation("common");
  const pathname = usePathname();
  const router = useRouter();

  // 将函数声明移到前面
  const handleLanguageChange = async (newLang: string) => {
    await i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  // 如果是token页面，只显示语言切换按钮
  const isTokenPage = pathname === "/token";

  if (isTokenPage) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16">
          <div className="h-full flex items-center justify-between">
            <div className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent">
              {t("common.appName")}
            </div>
            <button
              className="p-2 rounded-lg hover:bg-gray-50/80 transition-colors relative group"
              onClick={() =>
                handleLanguageChange(i18n.language === "zh" ? "en" : "zh")
              }
            >
              <Globe className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-200 shadow-sm px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {i18n.language === "zh"
                  ? t("header.language.zh")
                  : t("header.language.en")}
              </span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  const [apiKey, setApiKey] = useState(t("common.loading"));
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setAccessToken(token);

    if (!token) {
      router.push("/token");
      return;
    }

    // 验证token的有效性
    fetch("/api/config", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          // 如果token无效，清除token并重定向
          localStorage.removeItem("access_token");
          router.push("/token");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => {
        setApiKey(t("common.error"));
        // 发生错误时也清除token并重定向
        localStorage.removeItem("access_token");
        router.push("/token");
      });
  }, [router, t]);

  const handleCopyApiKey = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      message.error(t("header.messages.unauthorized"));
      return;
    }
    if (apiKey === t("models.table.notSet") || apiKey === t("common.error")) {
      message.error(t("header.messages.apiKeyNotSet"));
      return;
    }
    navigator.clipboard.writeText(apiKey);
    message.success(t("header.messages.apiKeyCopied"));
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/token";
  };

  const checkUpdate = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      message.error(t("header.messages.unauthorized"));
      return;
    }

    setIsCheckingUpdate(true);
    try {
      const response = await fetch(
        "https://api.github.com/repos/variantconst/openwebui-monitor/releases/latest"
      );
      const data = await response.json();
      const latestVersion = data.tag_name;

      if (!latestVersion) {
        throw new Error(t("header.messages.getVersionFailed"));
      }

      const currentVer = APP_VERSION.replace(/^v/, "");
      const latestVer = latestVersion.replace(/^v/, "");

      if (currentVer === latestVer) {
        message.success(
          `${t("header.messages.latestVersion")} v${APP_VERSION}`
        );
      } else {
        return new Promise((resolve) => {
          const dialog = document.createElement("div");
          document.body.appendChild(dialog);

          const DialogComponent = () => {
            const [open, setOpen] = useState(true);

            const handleClose = () => {
              setOpen(false);
              document.body.removeChild(dialog);
              resolve(null);
            };

            const handleUpdate = () => {
              window.open(
                "https://github.com/VariantConst/OpenWebUI-Monitor/releases/latest",
                "_blank"
              );
              handleClose();
            };

            return (
              <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="w-[calc(100%-2rem)] !max-w-[70vw] sm:max-w-[425px] rounded-lg">
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
                        <Github className="w-4 h-4 text-gray-500" />
                      </div>
                      <DialogTitle className="text-base sm:text-lg">
                        {t("header.update.newVersion")}
                      </DialogTitle>
                    </div>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 sm:gap-4 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-muted-foreground">
                        {t("header.update.currentVersion")}
                      </span>
                      <span className="font-mono text-sm sm:text-base">
                        v{APP_VERSION}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-muted-foreground">
                        {t("header.update.latestVersion")}
                      </span>
                      <span className="font-mono text-sm sm:text-base text-primary">
                        {latestVersion}
                      </span>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="h-8 sm:h-10 text-sm sm:text-base"
                    >
                      {t("header.update.skipUpdate")}
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      className="h-8 sm:h-10 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {t("header.update.goToUpdate")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          };

          createRoot(dialog).render(<DialogComponent />);
        });
      }
    } catch (error) {
      message.error(t("header.messages.updateCheckFailed"));
      console.error(t("header.messages.updateCheckFailed"), error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // 简化动画变量
  const menuItemVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  };

  const menuIconVariants = {
    initial: { rotate: 0 },
    hover: { rotate: 180 },
  };

  // 修改items数组中的motion.div配置
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <motion.div
          variants={menuItemVariants}
          className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-700 transition-colors"
          onClick={handleCopyApiKey}
        >
          <Copy className="w-4 h-4 text-gray-500" />
          <span>{t("header.menu.copyApiKey")}</span>
        </motion.div>
      ),
    },
    {
      key: "2",
      label: (
        <motion.div
          variants={menuItemVariants}
          className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-700 transition-colors"
          onClick={() => setIsBackupModalOpen(true)}
        >
          <Database className="w-4 h-4 text-gray-500" />
          <span>{t("header.menu.dataBackup")}</span>
        </motion.div>
      ),
    },
    {
      key: "3",
      label: (
        <motion.div
          variants={menuItemVariants}
          className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-700 transition-colors"
          onClick={checkUpdate}
        >
          <Github
            className={`w-4 h-4 text-gray-500 ${
              isCheckingUpdate ? "animate-spin" : ""
            }`}
          />
          <span>{t("header.menu.checkUpdate")}</span>
        </motion.div>
      ),
    },
    {
      type: "divider",
      style: { margin: "4px 0" },
    },
    {
      key: "4",
      label: (
        <motion.div
          variants={menuItemVariants}
          className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-700 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 text-gray-500" />
          <span>{t("header.menu.logout")}</span>
        </motion.div>
      ),
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16">
          <div className="h-full flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent"
            >
              {t("common.appName")}
            </Link>

            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg hover:bg-gray-50/80 transition-colors relative group"
                onClick={() =>
                  handleLanguageChange(i18n.language === "zh" ? "en" : "zh")
                }
              >
                <Globe className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center
                  min-w-[18px] h-[18px] text-[10px] font-medium bg-gray-100 
                  text-gray-600 rounded-full border border-gray-200 
                  shadow-sm px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {i18n.language === "zh"
                    ? t("header.language.zh")
                    : t("header.language.en")}
                </span>
              </button>

              <Dropdown
                menu={{
                  items,
                  className: "!p-1.5 min-w-[160px]",
                }}
                trigger={["click"]}
                placement="bottomRight"
                dropdownRender={(menu) => (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ ease: "easeOut", duration: 0.1 }}
                    className="bg-white rounded-lg shadow-lg border border-gray-100"
                  >
                    {menu}
                  </motion.div>
                )}
              >
                <motion.button
                  className="p-2 rounded-lg hover:bg-gray-50/80 transition-colors"
                  variants={menuIconVariants}
                  initial="initial"
                  whileHover="hover"
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </motion.button>
              </Dropdown>
            </div>
          </div>
        </div>
      </header>

      <DatabaseBackup
        open={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        token={accessToken || undefined}
      />
    </>
  );
}
