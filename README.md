# AzHava

Live weather for Azerbaijan, with a sky that changes with the weather. Portfolio project.

**🌤 Live: [az-hava.vercel.app](https://az-hava.vercel.app)** — open it on your phone and press "Install app" to add it to your home screen.

- **Cities:** 18 Azerbaijani cities (Baku, Ganja, Sumgait, Shaki, Lankaran, Quba, Gabala, Shusha, Nakhchivan, Khankendi…), 10 world cities, and worldwide search.
- **Forecast:** current conditions, the next 24/48 hours (temperature curve and chance of precipitation), and 7/16 days with an expandable detail panel for each day.
- **Details:** feels-like temperature, humidity and dew point, wind (compass), pressure (gauge), UV index, precipitation, sunrise/sunset (live sun arc), visibility, and air quality (European AQI plus 6 pollutants).
- **Animated sky:** the background follows the current weather and day/night (sun, moon, stars, drifting clouds, fog, canvas rain/snow, lightning) and cross-fades between states. `prefers-reduced-motion` is respected.
- **Plain-language tips:** the forecast is turned into short advice (take an umbrella, wear sunscreen, roads may be icy…), today is compared with yesterday, and every metric has a "What is this?" explanation.
- **Interaction:** hovering, tapping or using the arrow keys on the hourly chart opens that hour's details. Search shows recently viewed places and has a "Use my location" button. A "Updated X min ago" line comes with a refresh button, and a banner appears when you are offline.
- **Animation:** page changes use the View Transitions API, cards rise in with scroll-driven animations (no JS), and numbers count up. A light follows the cursor across cards, and starring a place sends out sparks. The sky adds shooting stars, wind streaks, sunbeams and rainbows.
- **Performance:** only 2 sky gradient layers exist at a time; the canvas draws at DPR 1 in 3 batched draw calls per frame and pauses when the tab is hidden; counters write straight to the DOM; forecasts are prefetched on hover; vendor code ships in separate chunks; blur is lighter on phones.
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
