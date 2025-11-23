# Supabase 安全問題修復指南

## 問題說明

Supabase 顯示了以下安全和性能警告：

### 1. RLS (Row Level Security) 未啟用

**問題**：
- `public.users` 表沒有啟用 RLS
- `public.events` 表沒有啟用 RLS
- `public._prisma_migrations` 表沒有啟用 RLS

**風險**：
- 任何有數據庫訪問權限的人都可以讀取/修改所有用戶的數據
- 用戶 A 可以看到用戶 B 的個人資料和事件
- 這是嚴重的**隱私和安全漏洞**

### 2. Function 安全問題

**問題**：
- `update_updated_at_column` function 有 mutable search_path

**風險**：
- 可能導致 SQL 注入攻擊
- 攻擊者可能通過修改 search_path 來執行惡意代碼

## 什麼是 Row Level Security (RLS)?

RLS 是 PostgreSQL 的安全功能，允許你在**行級別**控制訪問權限：

- **沒有 RLS**: 用戶可以看到表中的所有行
- **啟用 RLS**: 用戶只能看到符合 policy 條件的行

### 範例

```sql
-- 沒有 RLS：用戶 A 可以看到所有事件
SELECT * FROM events;
-- 結果：用戶 A、B、C 的所有事件

-- 有 RLS：用戶 A 只能看到自己的事件
SELECT * FROM events;
-- 結果：只有用戶 A 的事件
```

## 修復步驟

### 步驟 1：打開 Supabase SQL Editor

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案
3. 點擊左側選單的 **SQL Editor**
4. 點擊 **New Query**

### 步驟 2：執行 SQL 腳本

1. 打開本地的 `supabase_rls_setup.sql` 文件
2. 複製所有內容
3. 貼到 Supabase SQL Editor
4. 點擊 **Run** 或按 `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### 步驟 3：驗證修復

執行以下查詢來確認 RLS 已啟用：

```sql
-- 檢查 RLS 是否啟用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

應該看到所有表的 `rowsecurity` 都是 `true`。

執行以下查詢查看 policies：

```sql
-- 查看所有 policies
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 步驟 4：測試應用程式

1. 啟動開發伺服器：
   ```bash
   cd frontend
   pnpm dev
   ```

2. 測試以下功能：
   - ✅ 用戶註冊
   - ✅ 用戶登入
   - ✅ 創建事件
   - ✅ 查看自己的事件
   - ✅ 更新事件
   - ✅ 刪除事件
   - ✅ API token 功能

3. 確認用戶**不能**看到其他用戶的數據

## RLS Policies 說明

### Users 表的 Policies

```sql
-- 允許所有用戶查看用戶資料（API 需要）
"Users can view own profile" - SELECT

-- 允許用戶更新自己的資料
"Users can update own profile" - UPDATE

-- 允許註冊新用戶
"Users can insert own profile" - INSERT
```

### Events 表的 Policies

```sql
-- 只能查看自己的事件
"Users can view own events" - SELECT

-- 可以創建事件（應用會設定 userId）
"Users can create own events" - INSERT

-- 只能更新自己的事件
"Users can update own events" - UPDATE

-- 只能刪除自己的事件
"Users can delete own events" - DELETE
```

## 生產環境建議

### 1. 更嚴格的 Policies

目前的 policies 比較寬鬆（適合開發）。生產環境建議：

```sql
-- 範例：更嚴格的 SELECT policy
CREATE POLICY "Users can view own events"
ON public.events
FOR SELECT
USING (
  "userId" = (
    SELECT id FROM public.users
    WHERE email = current_user
  )
);
```

### 2. 使用 Supabase Auth

如果使用 Supabase 內建的 Auth，可以使用 `auth.uid()`：

```sql
CREATE POLICY "Users can view own events"
ON public.events
FOR SELECT
USING ("userId" = auth.uid()::text);
```

### 3. 定期審查 Policies

- 每月檢查一次 RLS policies
- 確保沒有過度寬鬆的權限
- 記錄所有 policy 變更

### 4. 啟用審計日誌

在 Supabase Dashboard:
1. 前往 **Database** > **Extensions**
2. 啟用 `pg_audit` extension
3. 配置審計規則

## 常見問題 FAQ

### Q1: 啟用 RLS 後應用程式出錯怎麼辦？

**A**: 檢查以下幾點：
1. 確認所有必要的 policies 都已創建
2. 檢查應用程式是否正確設定 userId
3. 查看 Supabase logs：Dashboard > Logs > Database

### Q2: 如何暫時停用 RLS 來測試？

**A**: **不建議**在生產環境這樣做，但開發時可以：

```sql
-- 停用 RLS（僅測試用）
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- 重新啟用
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
```

### Q3: _prisma_migrations 表需要 RLS 嗎？

**A**:
- 技術上不需要，因為它只包含 migration 歷史
- 但啟用 RLS 可以消除 Supabase 的警告
- 我們的腳本已經處理了這個表

### Q4: 如何查看當前的 RLS 設定？

**A**: 使用以下查詢：

```sql
-- 查看所有表的 RLS 狀態
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 查看詳細的 policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Q5: 修復後警告還在？

**A**:
1. 重新整理 Supabase Dashboard
2. 等待幾分鐘（快取可能需要時間更新）
3. 確認 SQL 腳本執行成功（沒有錯誤）
4. 重新執行驗證查詢

## 相關資源

- [PostgreSQL RLS 官方文檔](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [常見 RLS 模式](https://supabase.com/docs/guides/database/postgres/row-level-security)

## 總結

✅ **已修復**：
- 為 `users` 和 `events` 表啟用 RLS
- 創建適當的 policies 確保數據隔離
- 修復 `update_updated_at_column` function 的 search_path 問題
- 為 `_prisma_migrations` 表啟用 RLS

⚠️ **重要提醒**：
- 啟用 RLS 後，務必測試所有應用功能
- 確保應用程式正確處理 userId
- 定期審查和更新 security policies
- 在生產環境考慮更嚴格的權限控制
