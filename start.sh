#!/bin/sh

# 如果使用外部数据库，等待外部 PostgreSQL 服务启动
echo "Waiting for PostgreSQL to start..."
while ! nc -z ${POSTGRES_HOST:-db} ${POSTGRES_PORT:-5432}; do
  sleep 1
done
echo "PostgreSQL is up!"

# 创建数据库（如果不存在）
echo "Creating database if not exists..."
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST:-db} -p ${POSTGRES_PORT:-5432} -U ${POSTGRES_USER:-postgres} -tc "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DATABASE:-openwebui_monitor}'" | grep -q 1 || \
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST:-db} -p ${POSTGRES_PORT:-5432} -U ${POSTGRES_USER:-postgres} -c "CREATE DATABASE ${POSTGRES_DATABASE:-openwebui_monitor}"
echo "Database setup completed!"

# 等待新创建的数据库准备就绪
sleep 2

# 初始化数据库表
echo "Initializing database tables..."
pnpm db:push

# 启动应用
echo "Starting application..."
pnpm start 