// Единственная точка обращения к веб-сервису «Проценка».
// Компоненты и стор не знают про URL и формат ответа — только про нормализованные данные.

import { normalizeGoods } from "../lib/nomenclature";

// API доступен по HTTPS и разрешает CORS (Access-Control-Allow-Origin: *),
// поэтому обращаемся к нему напрямую — прокси не нужен.
const API_URL =
  import.meta.env.VITE_API_URL || "https://api.favorit-parts.ru/hs/hsprice/";

// URLSearchParams сам экранирует спецсимволы (# -> %23, & -> %26), как требует документация.
export function buildUrl(params) {
  const query = new URLSearchParams();

  if (params.key) query.set("key", params.key);
  if (params.number) query.set("number", params.number);
  if (params.brand) query.set("brand", params.brand);
  // analogues имеет смысл только вместе с brand
  if (params.brand && params.analogues) query.set("analogues", "on");
  if (params.info) query.set("info", "on");

  return `${API_URL}?${query.toString()}`;
}

export async function requestGoods(params) {
  let response;

  try {
    response = await fetch(buildUrl(params));
  } catch {
    throw new Error("Сервис недоступен: проверьте подключение к сети.");
  }

  if (!response.ok) {
    throw new Error(`Сервис ответил ошибкой HTTP ${response.status}.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Сервис вернул некорректный (не JSON) ответ.");
  }

  return normalizeGoods(data);
}
