# 晾衣判斷

晚上洗衣前打開,看「今晚晾陽台,明早收衣會不會乾、會不會下雨」。Vue 3 + Vite + TypeScript + Tailwind CSS v4,天氣資料來自中央氣象署開放資料平臺(鄉鎮天氣預報 F-D0047)。

## 第一次使用

```bash
npm install
cp .env.example .env.local     # 填入 CWA_API_KEY
npm run dev                    # 第一次會自動產生全台區域與座標表(GPS 定位需要)
```

`npm run dev` 與 `npm run build` 開始前會檢查區域座標表,沒有座標且找得到 key 就自動產生一次;沒有 key 或連不上時只印一行提示,不會中斷。想自己確認資料格式可另外跑 `npm run probe`。

不想先接 API 看畫面:開 `http://localhost:5173/?demo=clear`、`?demo=rain`、`?demo=humid`。

## 架構

- `functions/api/forecast.ts`:Cloudflare Pages Function。API Key 只存在伺服器端,前端呼叫自己的 `/api/forecast?county=臺北市&district=南港區`。
- `server/`:CWA 回傳資料的解析與請求處理(`npm run dev` 用 Vite 中介層跑同一份程式,Pages 上跑同一份)。
- `src/lib/analyze.ts`:結論與乾燥預估的判斷邏輯,門檻常數都在檔案最上方。
- `src/components/`:畫面。設定存在 localStorage(語言、縣市區域、預設時間、陽台遮雨、外觀)。
- GPS 只在設定面板按「使用目前位置」時才會詢問權限,不會一開頁面就跳。

## 部署到 Cloudflare Pages

- Build command:`npm run build`,輸出目錄:`dist`
- 在 Pages 專案設定新增加密環境變數 `CWA_API_KEY`
- `functions/` 會自動成為 `/api/*`

## 尚未驗證的地方(請先跑 `npm run probe`)

1. **回傳結構**:`server/cwa.ts` 依氣象署產品說明文件的欄位名稱撰寫(Locations > Location > WeatherElement > Time > ElementValue),但最外層的 `records` 包裝與 ElementValue 的實際形狀沒有用真實回應確認。結構不符時,`probe` 會印出實際內容。
2. **資料集代碼**:`src/data/counties.ts` 的縣市對應代碼取自第三方整理,probe 時一併確認臺北市是 F-D0047-061。
3. **預報時距**:F-D0047 同時有逐 1、3、12 小時的資料。解析器把每個值延伸到下一筆,所以逐 3 小時也能運作,但逐時資料會比較準。
4. **WeatherCode 對照**:`src/lib/icons.ts` 假設 01 到 03 為晴,其餘為陰,只影響圖示,不影響結論。
5. **乾燥預估**是依溫度、濕度、風速算的經驗分數,沒有用實際曬衣結果校準。用幾天後調 `src/lib/analyze.ts` 的 `DRY_OK`、`DRY_HALF`。

## 指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 本機開發,/api 由 Vite 代理 |
| `npm run build` | 型別檢查並建置 |
| `npm test` | 單元測試(解析、判斷、時間窗、定位) |
| `npm run probe -- 臺北市 南港區` | 印出真實 API 回傳結構 |
| `npm run gen:districts` | 從氣象署回應產生區域與座標清單 |
