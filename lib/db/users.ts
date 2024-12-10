import { query } from "./client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
}

export async function ensureUserTableExists() {
  const tableExists = await query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'users'
    );
  `);

  if (tableExists.rows[0].exists) {
    await query(`
      ALTER TABLE users 
        ALTER COLUMN balance TYPE DECIMAL(16,6);
    `);

    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_at'
      );
    `);

    if (!columnExists.rows[0].exists) {
      await query(`
        ALTER TABLE users 
          ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
    }

    const deletedColumnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'deleted'
      );
    `);

    if (!deletedColumnExists.rows[0].exists) {
      await query(`
        ALTER TABLE users 
          ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
      `);
    }
  } else {
    await query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        balance DECIMAL(16, 6) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted BOOLEAN DEFAULT FALSE
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
    `);
  }
}

export async function getOrCreateUser(userData: any) {
  const result = await query(
    `
    INSERT INTO users (id, email, name, role, balance)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE
      SET email = $2, name = $3
      RETURNING *`,
    [
      userData.id,
      userData.email,
      userData.name,
      userData.role || "user",
      process.env.INIT_BALANCE || "0",
    ]
  );

  return result.rows[0];
}

export async function updateUserBalance(
  userId: string,
  cost: number
): Promise<number> {
  await ensureUserTableExists();

  console.log("正在更新用户余额:", { userId, cost });

  const currentBalance = await query(
    `SELECT balance FROM users WHERE id = $1`,
    [userId]
  );
  console.log("当前余额:", currentBalance.rows[0]?.balance);

  const result = await query(
    `
    UPDATE users 
      SET balance = (
        CAST(balance AS DECIMAL(16,6)) - 
        CAST($2 AS DECIMAL(16,6))
      )
      WHERE id = $1
      RETURNING balance`,
    [userId, cost]
  );

  if (result.rows.length === 0) {
    throw new Error("用户不存在");
  }

  const newBalance = Number(result.rows[0].balance);
  console.log("余额更新完成:", {
    userId,
    cost: cost.toFixed(6),
    oldBalance: currentBalance.rows[0]?.balance,
    newBalance: newBalance.toFixed(6),
    diff: (Number(currentBalance.rows[0]?.balance) - newBalance).toFixed(6),
  });

  return newBalance;
}

async function ensureDeletedColumnExists() {
  const deletedColumnExists = await query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'deleted'
    );
  `);

  if (!deletedColumnExists.rows[0].exists) {
    await query(`
      ALTER TABLE users 
        ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
    `);
  }
}

export async function deleteUser(userId: string) {
  await ensureDeletedColumnExists();

  const updateResult = await query(
    `
    UPDATE users 
      SET deleted = TRUE 
      WHERE id = $1`,
    [userId]
  );

  console.log(`User with ID ${userId} marked as deleted.`, updateResult);
}

export async function getUsers(page: number = 1, pageSize: number = 20) {
  await ensureDeletedColumnExists();

  const offset = (page - 1) * pageSize;

  const countResult = await query(
    `SELECT COUNT(*) FROM users WHERE deleted = FALSE`
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `
    SELECT id, email, name, role, balance, deleted
      FROM users
      WHERE deleted = FALSE
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );

  return {
    users: result.rows,
    total,
  };
}

export async function getAllUsers(includeDeleted: boolean = false) {
  const whereClause = includeDeleted
    ? ""
    : "WHERE (deleted = FALSE OR deleted IS NULL)";

  const result = await query(`
    SELECT id, email, name, role, balance, deleted
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
  `);

  return result.rows;
}
