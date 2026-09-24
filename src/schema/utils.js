// src/schema/utils.js

export function pathnameStartsWith(prefix) {
  return window.location.pathname.startsWith(prefix);
}

export function isRealUrl(url) {
  return Boolean(url) && url !== "#" && !url.startsWith("#");
}

const FR_MONTHS = {
  janvier: "01", février: "02", fevrier: "02", mars: "03", avril: "04",
  mai: "05", juin: "06", juillet: "07", août: "08", aout: "08",
  septembre: "09", octobre: "10", novembre: "11", décembre: "12", decembre: "12",
};

export function parseFrDate(text) {
  const match = (text || "").trim().toLowerCase().match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = FR_MONTHS[monthName];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

export function getIsoDate(root, selector) {
  const el = root.querySelector(selector);
  return el?.getAttribute("datetime") || null;
}

export function getFaqEntities(root, scopeSelector, questionSelector = ".faq_question", answerSelector = ".rich-text-faq") {
  const scope = scopeSelector ? root.querySelector(scopeSelector) : root;
  if (!scope) return [];

  return Array.from(scope.querySelectorAll(".faq_item"))
    .map((item) => {
      const question = item.querySelector(questionSelector)?.textContent?.trim();
      const answer = item.querySelector(answerSelector)?.textContent?.trim();
      if (!question || !answer) return null;

      return {
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      };
    })
    .filter(Boolean);
}

export function getBreadcrumbEntities(root, selector = ".breadcrumbs") {
  const nav = root.querySelector(selector);
  if (!nav) return [];

  const items = Array.from(nav.querySelectorAll("a")).map((a) => ({
    name: a.textContent.trim(),
    url: a.href,
  }));

  const activeText = nav.querySelector(".breadcrumbs-active")?.textContent?.trim();
  if (activeText) items.push({ name: activeText, url: window.location.href });

  return items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  }));
}

export function injectGraph(graph) {
  document.getElementById("schema-dynamic")?.remove();
  if (!graph.length) return;

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "schema-dynamic";
  script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  document.head.appendChild(script);
}