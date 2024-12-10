"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Loader2 } from "lucide-react";

export default function TokenPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { t } = useTranslation("common");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error(t("auth.accessTokenRequired"));
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem("access_token", token);
      const res = await fetch("/api/config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success(t("auth.loginSuccess"));
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        toast.error(t("auth.invalidToken"));
        localStorage.removeItem("access_token");
      }
    } catch (error) {
      console.error(t("auth.verificationFailed"), error);
      toast.error(t("auth.verificationFailed"));
      localStorage.removeItem("access_token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-white relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-0 left-0 w-[45rem] h-[45rem] bg-blue-50/40 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-purple-50/30 rounded-full blur-3xl -z-10 animate-float-delay" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6 z-10 px-4"
      >
        <Card className="border-border/40 shadow-lg backdrop-blur-md bg-background/95">
          <CardHeader className="space-y-3">
            <div className="mx-auto w-24 h-24 flex items-center justify-center">
              <img
                src="/icon.png"
                alt="Logo"
                className="w-24 h-24 object-contain"
              />
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-br from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent">
                {t("common.appName")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="token" className="text-sm font-medium">
                    {t("auth.accessToken")}
                  </Label>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground/70 hover:text-muted-foreground cursor-pointer transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-[260px] text-xs"
                      >
                        {t("auth.accessTokenHelp")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={t("auth.accessTokenPlaceholder")}
                    className="pr-4"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showToken"
                  checked={showToken}
                  onCheckedChange={(checked) =>
                    setShowToken(checked as boolean)
                  }
                />
                <Label
                  htmlFor="showToken"
                  className="text-sm font-medium leading-none cursor-pointer select-none"
                >
                  {t("auth.showToken")}
                </Label>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmit}
              className="w-full font-medium relative"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("auth.verifying")}
                </span>
              ) : (
                t("common.confirm")
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
