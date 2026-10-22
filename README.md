# AI 面試模擬器

使用者輸入想應徵的職位、選擇難度（初階／中階／進階），AI 面試官會產生 5 題面試題目；使用者逐題作答後，AI 會給出分數、優點、可改進之處與參考回答。

本網站採用 **BYOK（使用者自備 API Key）** 模式：使用者在頁面上輸入自己的 OpenAI API Key 才會呼叫 AI，伺服器不儲存 Key，也不需要設定任何環境變數。

## 架構

前端輸入（`app/page.tsx`）→ 後端 API Route（`app/api/interview/route.ts`）→ 呼叫 OpenAI → 回傳結果 → 顯示在網站上

## 本機執行

```bash
npm install
npm run dev
```

開啟 http://localhost:3000

## 本機測試用的 API Key（選用）

在專案根目錄建立 `.env.local`，內容：

```
OPENAI_API_KEY=你的key
```

- 只在 `npm run dev` 時生效，頁面上的 Key 欄位可以留空
- `.env.local` 已被 `.gitignore` 排除，**不會上傳到 GitHub**
- 部署到 Vercel 後這個設定完全不生效，網站維持 BYOK；**請勿在 Vercel 設定 OPENAI_API_KEY**
