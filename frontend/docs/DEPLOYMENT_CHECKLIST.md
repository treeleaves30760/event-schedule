# Event Schedule 部署檢查清單

> 完整的本地部署和 Production 設置指南

本文檔提供完整的步驟檢查清單，適合想要自行架設 Event Schedule 應用程式的使用者。按照順序完成每個步驟，確保應用程式正確運行。

## 📋 目錄

- [開發環境部署](#開發環境部署-development)
- [生產環境部署](#生產環境部署-production)
- [安全設置](#安全設置-security)
- [驗證與測試](#驗證與測試)
- [常見問題](#常見問題)

---

## 開發環境部署 (Development)

適合本地開發和測試使用。

### ✅ 步驟 1: 環境準備

- [ ] 安裝 Node.js 18 或更高版本
  ```bash
  node --version  # 應該 >= 18.x
  ```

- [ ] 安裝 pnpm (推薦) 或 npm
  ```bash
  npm install -g pnpm
  pnpm --version
  ```

- [ ] Clone 專案並進入目錄
  ```bash
  git clone <your-repo-url>
  cd event-schedule/frontend
  ```

- [ ] 安裝依賴
  ```bash
  pnpm install
  ```

### ✅ 步驟 2: 資料庫設置

#### 選項 A: SQLite (推薦，適合開發)

- [ ] 複製環境變數範本
  ```bash
  cp .env.example .env
  ```

- [ ] 在 `.env` 中設定資料庫
  ```env
  DATABASE_URL="file:./dev.db"
  ```

- [ ] 執行資料庫 migration
  ```bash
  npx prisma migrate dev --name init
  ```

- [ ] 確認資料庫文件已創建
  ```bash
  ls -la dev.db  # 應該看到 dev.db 文件
  ```

#### 選項 B: PostgreSQL 本地安裝

- [ ] 安裝 PostgreSQL
  ```bash
  # macOS
  brew install postgresql@15
  brew services start postgresql@15

  # Ubuntu/Debian
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  sudo systemctl start postgresql
  ```

- [ ] 創建資料庫和用戶
  ```bash
  # 進入 PostgreSQL
  psql postgres

  # 在 psql 中執行
  CREATE DATABASE event_schedule;
  CREATE USER event_user WITH PASSWORD 'your_password';
  GRANT ALL PRIVILEGES ON DATABASE event_schedule TO event_user;
  \q
  ```

- [ ] 在 `.env` 中設定連線字串
  ```env
  DATABASE_URL="postgresql://event_user:your_password@localhost:5432/event_schedule"
  ```

- [ ] 執行 migration
  ```bash
  npx prisma migrate dev --name init
  ```

### ✅ 步驟 3: AI Provider 設置

#### 選項 A: OpenAI (付費，但效果最好)

- [ ] 註冊 OpenAI 帳號並取得 API Key
  - 前往 https://platform.openai.com/api-keys
  - 創建新的 API Key

- [ ] 在 `.env` 中設定
  ```env
  LLM_PROVIDER="openai"
  OPENAI_API_KEY="sk-your-api-key-here"
  OPENAI_MODEL="gpt-4o-mini"
  ```

- [ ] 確認 OpenAI 帳號有足夠額度

#### 選項 B: Ollama (免費，本地運行)

- [ ] 安裝 Ollama
  ```bash
  # macOS / Linux
  curl -fsSL https://ollama.ai/install.sh | sh

  # 或從官網下載: https://ollama.ai
  ```

- [ ] 下載 LLM 模型
  ```bash
  # 推薦：llama3 (速度和效果平衡)
  ollama pull llama3

  # 其他選項
  ollama pull mistral      # 較小，更快
  ollama pull llama3:70b   # 較大，效果更好但慢
  ```

- [ ] 啟動 Ollama 服務
  ```bash
  ollama serve
  # 通常會自動在背景運行
  ```

- [ ] 在 `.env` 中設定
  ```env
  LLM_PROVIDER="ollama"
  OLLAMA_ENDPOINT="http://localhost:11434"
  OLLAMA_MODEL="llama3"
  ```

- [ ] 測試 Ollama 是否運行
  ```bash
  curl http://localhost:11434/api/tags
  # 應該返回已安裝的模型列表
  ```

### ✅ 步驟 4: 安全設置

- [ ] 生成 JWT Secret
  ```bash
  openssl rand -hex 32
  ```

- [ ] 在 `.env` 中設定
  ```env
  JWT_SECRET="<剛才生成的 secret>"
  ```

- [ ] (可選) 設定 Auth0
  - 如果不需要 OAuth，可以跳過
  - 參考 [README.md](../README.md) 的 Auth0 設置說明

### ✅ 步驟 5: 啟動開發伺服器

- [ ] 啟動應用程式
  ```bash
  pnpm dev
  ```

- [ ] 打開瀏覽器測試
  ```
  http://localhost:3000
  ```

- [ ] 確認以下功能：
  - [ ] 可以註冊新帳號
  - [ ] 可以登入
  - [ ] 可以創建事件（測試 AI 功能）
  - [ ] 可以查看、編輯、刪除事件

---

## 生產環境部署 (Production)

適合正式環境使用，包含完整的安全設置。

### ✅ 步驟 1: Supabase 設置

- [ ] 創建 Supabase 帳號
  - 前往 https://supabase.com
  - 創建新專案

- [ ] 記錄資料庫密碼
  - ⚠️ 密碼只會顯示一次，請妥善保存

- [ ] 取得連線字串
  - 前往 Supabase Dashboard
  - Settings > Database
  - 複製 "Connection string" 和 "Direct connection string"

- [ ] 設定環境變數
  ```env
  # 注意：特殊字符需要 URL encode
  # # -> %23, @ -> %40, & -> %26
  DATABASE_URL="postgresql://postgres.xxxx:password@xxx.supabase.co:6543/postgres?pgbouncer=true"
  DIRECT_URL="postgresql://postgres.xxxx:password@xxx.supabase.co:5432/postgres"
  ```

### ✅ 步驟 2: 資料庫 Migration

- [ ] 執行 Prisma migration
  ```bash
  npx prisma migrate deploy
  ```

- [ ] 在 Supabase Dashboard 確認表已創建
  - Table Editor > 應該看到 `users` 和 `events` 表

### ✅ 步驟 3: 安全設置 (RLS)

**非常重要！** 不設定 RLS 會導致嚴重的資料洩露風險。

- [ ] 打開 Supabase SQL Editor
  - Dashboard > SQL Editor > New Query

- [ ] 執行 RLS 設定腳本
  - 打開 [`docs/deployment/supabase_rls_setup.sql`](./deployment/supabase_rls_setup.sql)
  - 複製所有內容
  - 貼到 SQL Editor
  - 點擊 Run

- [ ] 驗證 RLS 已啟用
  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';
  ```
  所有表應該顯示 `rowsecurity = true`

- [ ] 驗證 Policies 已創建
  ```sql
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename;
  ```

- [ ] 檢查 Supabase Dashboard
  - 確認安全警告已消失

📖 詳細說明請參考：[`docs/deployment/SUPABASE_SECURITY.md`](./deployment/SUPABASE_SECURITY.md)

### ✅ 步驟 4: 環境變數設置

- [ ] 設定所有必要的環境變數
  ```env
  # 資料庫
  DATABASE_URL="postgresql://..."
  DIRECT_URL="postgresql://..."

  # JWT
  JWT_SECRET="<使用 openssl rand -hex 32 生成>"

  # AI Provider (選擇一個)
  LLM_PROVIDER="openai"
  OPENAI_API_KEY="sk-..."
  OPENAI_MODEL="gpt-4o-mini"

  # 或使用 Ollama
  # LLM_PROVIDER="ollama"
  # OLLAMA_ENDPOINT="http://your-ollama-server:11434"
  # OLLAMA_MODEL="llama3"
  ```

- [ ] ⚠️ 確保生產環境的 `.env` 不會被提交到 Git
  ```bash
  # .env 應該在 .gitignore 中
  cat .gitignore | grep .env
  ```

### ✅ 步驟 5: 構建和部署

#### 選項 A: Vercel 部署 (推薦)

- [ ] 安裝 Vercel CLI
  ```bash
  npm install -g vercel
  ```

- [ ] 登入 Vercel
  ```bash
  vercel login
  ```

- [ ] 部署
  ```bash
  vercel
  ```

- [ ] 在 Vercel Dashboard 設定環境變數
  - Settings > Environment Variables
  - 添加所有 `.env` 中的變數

- [ ] 重新部署
  ```bash
  vercel --prod
  ```

#### 選項 B: Docker 部署

- [ ] 創建 Dockerfile (如果還沒有)
  ```dockerfile
  FROM node:18-alpine

  WORKDIR /app

  # 安裝依賴
  COPY package.json pnpm-lock.yaml ./
  RUN npm install -g pnpm && pnpm install --frozen-lockfile

  # 複製源代碼
  COPY . .

  # 生成 Prisma Client
  RUN npx prisma generate

  # 構建
  RUN pnpm build

  # 暴露端口
  EXPOSE 3000

  # 啟動
  CMD ["pnpm", "start"]
  ```

- [ ] 構建 Docker image
  ```bash
  docker build -t event-schedule .
  ```

- [ ] 運行容器
  ```bash
  docker run -d \
    -p 3000:3000 \
    -e DATABASE_URL="..." \
    -e JWT_SECRET="..." \
    -e OPENAI_API_KEY="..." \
    --name event-schedule \
    event-schedule
  ```

#### 選項 C: VPS 部署 (Ubuntu/Debian)

- [ ] 更新系統
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] 安裝 Node.js
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  ```

- [ ] 安裝 pnpm
  ```bash
  npm install -g pnpm
  ```

- [ ] Clone 專案
  ```bash
  git clone <your-repo>
  cd event-schedule/frontend
  ```

- [ ] 安裝依賴並構建
  ```bash
  pnpm install
  pnpm build
  ```

- [ ] 使用 PM2 管理進程
  ```bash
  # 安裝 PM2
  npm install -g pm2

  # 啟動應用
  pm2 start pnpm --name "event-schedule" -- start

  # 設定開機自啟
  pm2 startup
  pm2 save
  ```

- [ ] 設定 Nginx 反向代理
  ```nginx
  server {
      listen 80;
      server_name your-domain.com;

      location / {
          proxy_pass http://localhost:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
      }
  }
  ```

- [ ] 設定 SSL (使用 Let's Encrypt)
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d your-domain.com
  ```

---

## 安全設置 (Security)

### ✅ 生產環境安全檢查清單

- [ ] **資料庫安全**
  - [ ] RLS 已啟用在所有表
  - [ ] Policies 正確設定
  - [ ] 資料庫密碼夠強（至少 16 字符，包含大小寫、數字、符號）
  - [ ] 資料庫連線使用 SSL

- [ ] **應用程式安全**
  - [ ] JWT_SECRET 足夠隨機（使用 `openssl rand -hex 32`）
  - [ ] 所有 API Keys 存在環境變數，不在代碼中
  - [ ] `.env` 文件不被提交到 Git

- [ ] **網路安全**
  - [ ] 使用 HTTPS (SSL/TLS)
  - [ ] 設定 CORS（只允許你的域名）
  - [ ] 設定 Rate Limiting

- [ ] **Auth0 安全** (如果使用)
  - [ ] Callback URLs 只包含你的域名
  - [ ] Logout URLs 正確設定
  - [ ] Auth0 Secret 已設定

- [ ] **API 安全**
  - [ ] API Tokens 有過期時間
  - [ ] API Rate Limiting 已啟用
  - [ ] 輸入驗證完整

---

## 驗證與測試

### ✅ 功能測試清單

- [ ] **用戶認證**
  - [ ] 可以註冊新帳號
  - [ ] 可以登入
  - [ ] 可以登出
  - [ ] 錯誤的密碼無法登入
  - [ ] 重複的 email 無法註冊

- [ ] **事件管理**
  - [ ] 可以創建事件（手動）
  - [ ] 可以使用 AI 創建事件
  - [ ] 可以查看事件列表
  - [ ] 可以編輯事件
  - [ ] 可以刪除事件
  - [ ] 事件顯示在正確的矩陣位置

- [ ] **資料隔離**
  - [ ] 用戶 A 看不到用戶 B 的事件
  - [ ] 用戶 A 無法編輯用戶 B 的事件
  - [ ] API 正確驗證 userId

- [ ] **AI 功能**
  - [ ] AI 能正確解析自然語言
  - [ ] AI 能設定正確的時間
  - [ ] AI 能判斷事件類型
  - [ ] AI 能建議 urgency 和 importance

- [ ] **API 端點**
  - [ ] GET /api/events 返回當前用戶的事件
  - [ ] POST /api/events 可創建事件
  - [ ] PUT /api/events/:id 可更新事件
  - [ ] DELETE /api/events/:id 可刪除事件
  - [ ] 所有端點都需要認證

### ✅ 性能測試

- [ ] 頁面載入時間 < 2 秒
- [ ] AI 事件創建 < 5 秒
- [ ] 資料庫查詢優化
- [ ] 圖片和靜態資源已壓縮

### ✅ 安全測試

- [ ] SQL Injection 測試
- [ ] XSS 測試
- [ ] CSRF 保護
- [ ] Rate Limiting 測試

---

## 常見問題

### ❓ 開發環境 vs 生產環境的主要差異？

| 項目 | 開發環境 | 生產環境 |
|------|----------|----------|
| 資料庫 | SQLite / 本地 PostgreSQL | Supabase (雲端 PostgreSQL) |
| RLS | 可選 | **必須** |
| HTTPS | 不需要 | **必須** |
| 監控 | 不需要 | 建議使用 |
| 備份 | 不需要 | **必須** |

### ❓ 我應該選擇 OpenAI 還是 Ollama？

**OpenAI**:
- ✅ 效果最好，回應速度快
- ✅ 無需本地資源
- ❌ 需要付費
- ❌ 有 API rate limits
- ❌ 數據會傳送到 OpenAI

**Ollama**:
- ✅ 完全免費
- ✅ 數據保留在本地（隱私）
- ✅ 無 rate limits
- ❌ 需要本地運算資源（RAM/GPU）
- ❌ 首次回應較慢（模型載入）

**建議**：
- 個人使用 → Ollama
- 小團隊 → OpenAI (gpt-4o-mini 便宜)
- 企業 → OpenAI (gpt-4) 或自建 Ollama 伺服器

### ❓ 如何備份資料？

**SQLite**:
```bash
# 簡單複製文件
cp dev.db dev.db.backup
```

**Supabase**:
```bash
# 使用 pg_dump
pg_dump -h xxx.supabase.co -U postgres -d postgres > backup.sql

# 或使用 Supabase CLI
supabase db dump > backup.sql
```

### ❓ 如何遷移資料？

從 SQLite 到 Supabase:

```bash
# 1. 導出資料
sqlite3 dev.db .dump > data.sql

# 2. 轉換格式（SQLite 和 PostgreSQL 語法有差異）
# 建議使用工具如 pgloader

# 3. 或使用 Prisma
npx prisma db push
```

### ❓ 生產環境建議的伺服器規格？

**最低配置**（< 100 用戶）:
- CPU: 1 core
- RAM: 1GB
- Storage: 10GB

**推薦配置**（100-1000 用戶）:
- CPU: 2 cores
- RAM: 2GB
- Storage: 20GB

**注意**：如果使用 Ollama，建議：
- CPU: 4+ cores
- RAM: 8GB+ (視模型大小)
- GPU: 可選，但能大幅提升速度

---

## 📚 相關文檔

- [README.md](../README.md) - 完整的安裝和使用指南
- [SUPABASE_SECURITY.md](./deployment/SUPABASE_SECURITY.md) - Supabase 安全設置詳解
- [supabase_rls_setup.sql](./deployment/supabase_rls_setup.sql) - RLS 設定腳本

---

## 🆘 需要幫助？

如果遇到問題：

1. ✅ 檢查 [README.md Troubleshooting](../README.md#troubleshooting) 章節
2. ✅ 查看相關文檔
3. ✅ 確認所有環境變數正確設定
4. ✅ 檢查資料庫連線
5. ✅ 查看應用程式 logs

---

**部署愉快！** 🚀

如有任何問題，歡迎開 issue 或提交 pull request。
