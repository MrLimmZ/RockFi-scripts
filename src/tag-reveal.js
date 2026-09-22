// src/tag-reveal.js

function initTagReveal() {
  const tags = document.querySelectorAll(".tag");
  if (!tags.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 },
  );

  tags.forEach((tag) => observer.observe(tag));
}

export { initTagReveal };