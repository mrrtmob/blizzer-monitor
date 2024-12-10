import { ensureTablesExist } from "../lib/db";

async function init() {
  try {
    await ensureTablesExist();
    console.log("数据库初始化成功");
  } catch (error) {
    console.error("数据库初始化失败:", error);
    process.exit(1);
  }
}

init();
