// src/blog-faq.js

export function initBlogFaq(root = document) {
  const faqItems = root.querySelectorAll(".faq_item");
  if (!faqItems.length) return;

  faqItems.forEach((item, index) => {
    const trigger = item.querySelector(".faq_question-wrapper");
    const content = item.querySelector(".overflow-hidden");
    if (!trigger || !content) return;

    const contentId = `faq-answer-${index + 1}`;
    const triggerId = `faq-question-${index + 1}`;

    // 1. Rôles et liaisons sémantiques WAI-ARIA
    content.id = contentId;
    content.setAttribute("role", "region");
    content.setAttribute("aria-labelledby", triggerId);

    trigger.id = triggerId;
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0"); // Rendre focusable au clavier (touche Tab)
    trigger.setAttribute("aria-controls", contentId);
    trigger.setAttribute("aria-expanded", "false");

    // 2. Navigation clavier : Entrée ou Espace déclenche le clic Webflow existant
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        trigger.click(); // Déclenche l'interaction native Webflow sans conflit
      }
    });

    // 3. Synchronisation de l'état ouvert/fermé pour les lecteurs d'écran
    const observer = new MutationObserver(() => {
      const isOpen = content.style.height !== "0px" && content.style.height !== "";
      trigger.setAttribute("aria-expanded", String(isOpen));
    });

    observer.observe(content, {
      attributes: true,
      attributeFilter: ["style"],
    });
  });
}