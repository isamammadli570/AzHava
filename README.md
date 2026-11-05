# Lumen

Live weather for Azerbaijan, with a sky that changes with the weather. A portfolio project by **İsa Məmmədli**.

**🌤 Live: [az-hava.vercel.app](https://az-hava.vercel.app)** — open it on your phone and press "Install app" to add it to your home screen.

- **Cities:** 18 Azerbaijani cities (Baku, Ganja, Sumgait, Shaki, Lankaran, Quba, Gabala, Shusha, Nakhchivan, Khankendi…), 10 world cities, and worldwide search.
- **Forecast:** current conditions, the next 24/48 hours (temperature curve and chance of precipitation), and 7/16 days; tapping a day opens it in the conditions sheet.
- **Details:** feels-like temperature, humidity and dew point, wind (compass), pressure (gauge), UV index, precipitation, sunrise/sunset (live sun arc), visibility, and air quality (European AQI plus 6 pollutants).
- **Detail sheets:** tapping a card opens a sheet (a bottom sheet on phones, a panel on desktop) with a 16-day picker: hourly charts you can scrub with a finger (temperature real/feels-like, chance of rain, wind and gusts with direction arrows, UV, humidity, visibility, pressure), a plain-language summary of the day, comparisons with the day before, the Beaufort and UV scales, a moon timeline with a phase calendar and distance, and first/last light. Sheets live in the address (`?detail=wind&day=2`), so the back button closes them.
- **Night-glass design:** a near-black misty backdrop, frosted panels, hairline type and wide-tracked capitals. The weather is a glass sculpture: a cloud of glass bubbles that drips rain into a rippling pool, sheds snow or flickers with lightning, and a glass sun or moon on clear days and nights.
- **Seasons:** the whole interface is tinted by the season of the place on screen (icy blue in winter, mint in spring, warm gold in summer, amber in autumn), each with its own drifting particles (frost, petals, light motes, leaves). The "⋯" menu can show any of the four looks. `prefers-reduced-motion` is respected.
- **Extra cards:** moon phase (illumination, moonrise and moonset, next full moon, computed in the browser), an animated precipitation radar (RainViewer), and a comparison with yesterday.
- **Plain-language tips:** the forecast is turned into short advice (take an umbrella, wear sunscreen, roads may be icy…), today is compared with yesterday, and every metric has a "What is this?" explanation.
- **Interaction:** hovering, tapping or using the arrow keys on the hourly chart opens that hour's details. Search shows recently viewed places and has a "Use my location" button. A "Updated X min ago" line comes with a refresh button, and a banner appears when you are offline.
- **Animation:** pages build up in staged entrance animations, cards rise in with scroll-driven animations (no JS), and numbers count up. A light follows the cursor across cards, and starring a place sends out sparks. The sky adds shooting stars, wind streaks, sunbeams and rainbows.
- **Performance (measured):** in headless Chrome with the CPU slowed 4× to stand in for a weaker phone: 165 FPS idle, while scrolling and on hover (the screen refresh limit), and the worst page-transition frame went from 297 ms to under 85 ms. How: every looping animation runs on the GPU (icons animate whole SVG layers, never shapes inside an SVG); sky effects that are not visible are removed from the page; pages build up in stages a frame apart, and city changes render with `useDeferredValue`; rain and snow are CSS elements moved in a few shared sheets (one animation per sheet, not per drop); forecasts are prefetched on hover; vendor code ships in separate chunks.
- **Adaptive quality:** like a game's auto-settings, the app measures the real frame rate after it has settled and, if the device cannot hold ~50 FPS (or is in data-saver mode), switches to a light preset with no glass blur, fewer clouds and particles, and no stars.
- **Favourites** are kept in `localStorage`, and open tabs stay in sync with each other.
- **PWA:** installs on a phone like an app (Android: "Install app", iPhone: Share → "Add to Home Screen"). With no internet it opens and shows the last forecast, marked with when it is from. When a new version is published it offers a "Reload". The service worker is written by hand: `pwa/sw-template.js`, with the build list filled in by `pwa/plugin.ts`.
- **Languages:** Azerbaijani (default), English, Russian.

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · TanStack Query · React Router v7 · i18next · Radix UI · Vitest

The data comes from [Open-Meteo](https://open-meteo.com/) (no key needed, CC BY 4.0): forecast, air quality and geocoding.

## Running it

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test:run` | Unit tests |
| `docker compose up --build` | Served by nginx at http://localhost:8080 |

## Structure

```
src/
  api/          Open-Meteo clients and types (forecast, air quality, geocoding)
  hooks/        React Query hooks (useGetForecast, useGetAirQuality, useSearchPlaces) and app hooks
  helpers/      pure functions (WMO codes, formatting, chart curves, search) and their tests
  constants/    cities, routes, endpoints, query keys
  widgets/      shared components (SkyBackground, WeatherIcon, PlaceSearch…)
  pages/        WeatherPage and CitiesPage, each with its own parts in widgets/
  i18n/         AZ / EN / RU translations
```
