"use client";

import { useState, useEffect } from "react";
import { Dropdown, Avatar } from "antd";
import type { MenuProps } from "antd";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtVerify } from "jose";
import React from "react";

const JWT_SECRET = "your-secret-key";

interface UserInfo {
  username: string;
  isAdmin: boolean;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("UserMenu 组件加载");
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    console.log("获取到的完整 cookie:", document.cookie);
    console.log("解析出的 token:", token);

    if (token) {
      jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
        .then(({ payload }) => {
          console.log("token 验证成功，payload:", payload);
          setUser({
            username: payload.username as string,
            isAdmin: payload.isAdmin as boolean,
          });
        })
        .catch((error) => {
          console.error("token 验证失败:", error);
          document.cookie =
            "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          router.push("/auth");
        });
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      console.log("开始退出登录");
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      console.log("退出登录响应状态:", res.status);
      if (res.ok) {
        router.push("/auth");
        router.refresh();
      }
    } catch (error) {
      console.error("退出登录失败:", error);
    }
  };

  const items: MenuProps["items"] = [
    {
      key: "logout",
      label: "退出登录",
      icon: <LogOut className="w-4 h-4 text-gray-500" />,
      onClick: handleLogout,
    },
  ];

  console.log("当前用户状态:", user);

  if (!user) {
    console.log("用户未登录，不显示菜单");
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-50">
      <Dropdown menu={{ items }} placement="bottomRight">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50/80 px-3 py-1.5 rounded-full transition-colors">
          <Avatar
            size="small"
            icon={<User className="w-3 h-3 text-gray-600" />}
          />
          <span className="text-sm text-gray-600">{user.username}</span>
        </div>
      </Dropdown>
    </div>
  );
}
