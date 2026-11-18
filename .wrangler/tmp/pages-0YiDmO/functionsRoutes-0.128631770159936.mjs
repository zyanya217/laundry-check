import { onRequestGet as __api_forecast_ts_onRequestGet } from "/Users/b3026/Desktop/laundry-check/functions/api/forecast.ts"

export const routes = [
    {
      routePath: "/api/forecast",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_forecast_ts_onRequestGet],
    },
  ]