"use client";

import { useState } from "react";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      console.log("开始登录请求");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
        },
        body: JSON.stringify(values),
      });

      // ... rest of the code ...
    } catch (error) {
      console.error("登录请求失败:", error);
      setError(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component
}
