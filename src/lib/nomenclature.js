// Чистые функции работы с данными веб-сервиса «Проценка».
// Отделены от сетевых вызовов, чтобы их можно было покрыть юнит-тестами.

// Ошибки, описанные в документации сервиса, переводим в понятный пользователю текст.
export const ERROR_DESCRIPTIONS = {
  "Empty key!": "Не указан ключ покупателя.",
  "Invalid key client!": "Неверный ключ покупателя: покупатель не найден.",
  "Empty number goods!": "Не указан номер детали.",
  "Request quota exceeded!": "Превышен лимит запросов к сервису.",
};

export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function formatApiError(error) {
  const list = (Array.isArray(error) ? error : [error])
    .map(String)
    .map((text) => text.trim())
    .filter(Boolean);
  if (list.length === 0) return "Веб-сервис вернул неизвестную ошибку.";
  return list.map((text) => ERROR_DESCRIPTIONS[text] || text).join(" ");
}

// Пустая позиция — ответ сервиса «товар не найден»: массив goods содержит один пустой объект.
function isEmptyGoods(item) {
  return !item || (!item.number && !item.name && !item.brand);
}

// Приводит ответ сервиса к массиву позиций и превращает поле error в исключение.
export function normalizeGoods(response) {
  if (!response || typeof response !== "object") return [];
  if (response.error) throw new Error(formatApiError(response.error));
  const goods = Array.isArray(response.goods) ? response.goods : [];
  return goods.filter((item) => !isEmptyGoods(item));
}

// Этап 1: по ответу без brand собираем уникальных производителей для выбора.
export function extractBrands(goods) {
  const brands = new Map();

  goods.forEach((item) => {
    const brand = (item.brand || "").trim();
    if (!brand) return;

    const current = brands.get(brand) || { brand, positions: 0, stock: 0 };
    current.positions += 1;
    current.stock += toNumber(item.count);
    brands.set(brand, current);
  });

  return [...brands.values()].sort((a, b) =>
    a.brand.localeCompare(b.brand, "ru")
  );
}

// Цена в goods.price по документации использовать нельзя — берём цену конкретного склада
// среди складов с ненулевым остатком (выгодное предложение).
export function pickBestOffer(item) {
  const offers = (item?.warehouses || []).filter(
    (warehouse) => toNumber(warehouse.stock) > 0
  );
  if (offers.length === 0) return null;

  return offers.reduce(
    (best, offer) =>
      toNumber(offer.price) < toNumber(best.price) ? offer : best,
    offers[0]
  );
}

// Итоговые строки таблицы: исходные позиции + их аналоги без дублей.
export function buildRows(goods) {
  const rows = [];
  const seen = new Set();

  const addRow = (item, isSearched) => {
    if (!item) return;
    const rowKey = `${item.goodsID || ""}|${item.brand || ""}|${
      item.number || ""
    }`;
    if (seen.has(rowKey)) return;
    seen.add(rowKey);

    const offer = pickBestOffer(item);
    rows.push({
      key: rowKey,
      isSearched,
      brand: item.brand || "—",
      number: item.number || "—",
      name: item.name || "—",
      price: offer ? toNumber(offer.price) : null,
      stock: offer ? toNumber(offer.stock) : 0,
      totalStock: toNumber(item.count),
      warehouse: offer ? offer.code || offer.id || "" : "",
      own: Boolean(offer?.own),
      notRefund: Boolean(item.notRefund || offer?.notRefund),
    });
  };

  goods.forEach((item) => {
    addRow(item, true);
    (item.analogues || []).forEach((analogue) => addRow(analogue, false));
  });

  return rows.sort(
    (a, b) =>
      Number(b.isSearched) - Number(a.isSearched) ||
      (a.price ?? Infinity) - (b.price ?? Infinity)
  );
}

const priceFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(price) {
  if (price === null || price === undefined) return "нет данных";
  return `${priceFormatter.format(price)} ₽`;
}
