document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const toTop = document.getElementById('toTop');

  // Mobile menu toggle
  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    burger.classList.toggle('is-active', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.classList.remove('is-active');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  // Header background + back-to-top visibility on scroll
  const onScroll = () => {
    const scrolled = window.scrollY > 40;
    header.classList.toggle('is-scrolled', scrolled);
    toTop.classList.toggle('is-visible', window.scrollY > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Back to top
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Reveal animations on scroll
  const revealTargets = document.querySelectorAll(
    '.feature-card, .module-row, .cycle__step, .about__item, .biz-card, .cat, .team-card, .country'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach((el) => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }
});
