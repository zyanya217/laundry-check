# 今天要不要洗衣服？

晚上洗完衣服,打開就知道:**今晚晾在陽台,明早收衣會乾嗎?中間會下雨嗎?**

🔗 **線上使用:<https://laundry-check.pages.dev/>**

<img width="223" height="484" alt="截圖 2026-11-18 下午6 15 34" src="https://github.com/user-attachments/assets/ee0590c9-6b17-40ef-a6b5-e47d22b5ea0e" />

<img width="223" height="484" alt="截圖 2026-11-18 下午6 16 07" src="https://github.com/user-attachments/assets/950c88b2-bfb8-4795-b901-7655f0891a7d" />

<img width="223" height="484" alt="截圖 2026-11-18 下午6 16 34" src="https://github.com/user-attachments/assets/5ab26636-e68b-4743-ab8a-29ffbd938b3b" />

## 為什麼做這個

每次洗衣服前,我都會問 Google:「南港現在洗衣服晾在外面,明早收回來會乾嗎?這段期間會下雨嗎?適合晾陽台嗎?」
這個網頁把這個判斷直接做完,打開就是一個答案。

我的使用情境很固定:
- 晚上回到家,**7 點到 10 點之間**洗衣服,然後晾在陽台
- 隔天**早上 8 點上班前**收回來
- 如果收的時候還很濕,就改放在室內有窗的浴室


## 它能解決什麼

| 我想知道 | 畫面怎麼回答 |
| --- | --- |
| 能不能晾陽台 | 最上面一個大結論:**適合晾陽台** / **勉強可以** / **改晾室內**,一句話說明原因(例如「23:00–08:00 會下雨,最高機率 92%」) |
| 什麼時候下雨 | 從開始晾到收衣的**逐時降雨機率與濕度**圖,看得出是半夜 2 點下還是晚上 9 點下 |
| 明早乾不乾 | **乾燥預估**:乾了 / 半乾 / 還濕,依溫度、濕度、風速計算,不是只看降雨機率 |
| 還濕怎麼辦 | 結論下方直接給建議,例如「若還有點濕,移到室內有窗的浴室」 |

設計原則:打開就看到答案,不用看完整天氣預報,手機直式單手可用。

## 功能

- 預設地點**臺北市南港區**,在設定裡選縣市與區域,設定一次就會記住,不用每次調整
- 「使用目前位置」用 GPS 找最近的區域,只在按下按鈕時才會詢問定位權限
- 預設開始晾 21:00、收衣 08:00,可改
- 可標示「陽台有遮雨」,有加蓋時降雨機率的影響較小
- 繁體中文與 English、淺色與深色(或跟隨系統)
- 資料來源:[中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/)鄉鎮天氣預報

## 技術

Vue 3 + Vite + TypeScript + Tailwind CSS v4,部署在 [Cloudflare Pages](https://laundry-check.pages.dev/)。

- `functions/api/forecast.ts`:Cloudflare Pages Function。API Key 只存在伺服器端,前端呼叫自己的 `/api/forecast?county=臺北市&district=南港區`
- `server/`:氣象署回傳資料的解析與請求處理。本機 `npm run dev` 用 Vite 中介層執行同一份程式
- `src/lib/analyze.ts`:結論與乾燥預估的判斷邏輯,門檻常數都在檔案最上方
- `src/components/`:畫面。設定存在瀏覽器的 localStorage

## 本機執行

```bash
npm install
cp .env.example .env.local     # 填入 CWA_API_KEY
npm run dev                    # 第一次會自動產生全台區域與座標表(GPS 定位需要)
```

`CWA_API_KEY` 是在氣象署開放資料平臺申請的授權碼。`.env.local` 已列在 `.gitignore`,不要 commit。

不想先接 API 看畫面:開 `http://localhost:5173/?demo=clear`、`?demo=rain`、`?demo=humid`。

`npm run dev` 與 `npm run build` 開始前會檢查區域座標表,沒有座標且找得到 key 就自動產生一次;沒有 key 或連不上時只印一行提示,不會中斷。

## 部署到 Cloudflare Pages

```bash
npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name laundry-check --branch production
npx wrangler pages secret put CWA_API_KEY --project-name laundry-check
npx wrangler pages deploy dist --project-name laundry-check --branch production
```

最後一行是為了讓剛設定的 key 生效。每個指令請分開執行。

## 已知限制

1. **乾燥預估是經驗分數**,依溫度、濕度、風速計算,沒有用實際曬衣結果校準。用幾天後可調 `src/lib/analyze.ts` 的 `DRY_OK`、`DRY_HALF`。
2. **所有使用者共用同一把 API Key**,伺服器端有 15 分鐘快取。

## 指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 本機開發,/api 由 Vite 代理 |
| `npm run build` | 型別檢查並建置 |
| `npm test` | 單元測試(解析、判斷、時間窗、定位) |
| `npm run probe -- 臺北市 南港區` | 印出真實 API 回傳結構 |
| `npm run gen:districts` | 從氣象署回應產生區域與座標清單 |
