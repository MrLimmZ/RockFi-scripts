// src/blog-accordion.js
function initBlogAccordion() {
  const accordions = document.querySelectorAll(".accordion1_component");
  if (!accordions.length) return;

  accordions.forEach((accordion) => {
    const top = accordion.querySelector(".accordion1_top");
    const bottom = accordion.querySelector(".accordion1_bottom");
    const icon = accordion.querySelector(".accordion1_icon");
    if (!top || !bottom) return;

    bottom.style.height = "0px";

    top.addEventListener("click", () => {
      if (bottom.style.height !== "0px") {
        bottom.style.height = "0px";
        if (icon) icon.style.transform = "rotateZ(0deg)";
      } else {
        bottom.style.height = bottom.scrollHeight + "px";
        if (icon) icon.style.transform = "rotateZ(180deg)";
      }
    });
  });
}

export { initBlogAccordion };