/* Animal UltraPet — animações compartilhadas (GSAP + ScrollTrigger) */
(function () {
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ duration: 0.7, ease: "power3.out" });

  const mm = gsap.matchMedia();
  mm.add(
    { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
    (ctx) => {
      if (ctx.conditions.reduce) {
        gsap.set("[data-reveal], [data-hero] > *, .hero-fotos img, .bolha", { autoAlpha: 1, clearProps: "transform" });
        return;
      }

      // Hero: entrada em sequência
      const hero = document.querySelector("[data-hero]");
      if (hero) {
        const tl = gsap.timeline({ defaults: { duration: 0.8 } });
        tl.from("[data-hero] > *", { y: 26, autoAlpha: 0, stagger: 0.09 })
          .from(".hero-fotos img", { scale: 0.86, autoAlpha: 0, stagger: 0.12, ease: "back.out(1.5)" }, "<0.15")
          .from(".bolha", { y: 18, autoAlpha: 0, stagger: 0.15, ease: "back.out(2)" }, "-=0.4");
        gsap.to(".b1", { y: -8, duration: 2.2, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1.6 });
        gsap.to(".b2", { y: 8, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1.8 });
      }

      // Revelar ao rolar (em lote)
      gsap.set("[data-reveal]", { autoAlpha: 0, y: 30 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, stagger: 0.08, overwrite: true })
      });
    }
  );

  // Toast utilitário
  window.toast = function (msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    gsap.killTweensOf(t);
    gsap.timeline()
      .fromTo(t, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.35 })
      .to(t, { autoAlpha: 0, y: 10, duration: 0.3 }, "+=2.2");
  };
})();
