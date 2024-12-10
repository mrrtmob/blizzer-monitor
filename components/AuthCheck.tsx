"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      // 如果已经在token页面，不需要检查
      if (pathname === "/token") {
        setIsLoading(false);
        setIsAuthorized(true);
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/token");
        return;
      }

      try {
        const res = await fetch("/api/config", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("access_token");
          router.push("/token");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        localStorage.removeItem("access_token");
        router.push("/token");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  // 显示加载状态或空白页面
  if (isLoading || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
