// src/list-lenis-sync.js
// Recalcule Lenis à chaque fois que Finsweet List (filter/load) modifie le
// nombre d'items affichés — sans ça, Lenis garde en mémoire la hauteur de
// page calculée au chargement initial, et bloque le scroll à l'ancienne
// limite dès que "Afficher plus de conseillers" ajoute du contenu en bas.
//
// On accède directement à window.FinsweetAttributes.modules.list.loading
// (Promise résolue vers les instances de liste) plutôt que le système de
// queue window.fsAttributes.push(["list", ...]) qui ne rejoue pas les
// événements déjà passés pour un callback enregistré en retard.
//
// Cette version de Finsweet (1.14.6) n'expose pas de méthode .on() —
// confirmé en inspectant l'instance en runtime : le système utilise des
// hooks nommés via instance.addHook(nom, callback), pas des événements
// classiques. "afterRender" est le hook déclenché juste après que la
// liste a fini de rendre de nouveaux items (filtre, tri, ou chargement).

import { getLenis } from "./core.js";

export function initListLenisSync() {
  if (typeof window.FinsweetAttributes === "undefined") return;

  const listModule = window.FinsweetAttributes.modules?.list;
  if (!listModule || !listModule.loading) return;

  listModule.loading.then((listInstances) => {
    listInstances.forEach((instance) => {
      if (typeof instance.addHook !== "function") return;

      instance.addHook("afterRender", () => {
        const lenis = getLenis();
        if (!lenis) return;

        requestAnimationFrame(() => {
          lenis.resize();
        });
      });
    });
  });
}