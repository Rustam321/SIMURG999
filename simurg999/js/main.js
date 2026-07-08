document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const backdrop = document.getElementById('navBackdrop');
  const toTop = document.getElementById('toTop');

  // Side menu (left drawer)
  if (burger && nav && backdrop) {
    const setMenu = (open) => {
      nav.classList.toggle('is-open', open);
      burger.classList.toggle('is-active', open);
      backdrop.classList.toggle('is-visible', open);
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    };

    burger.addEventListener('click', () => {
      setMenu(!nav.classList.contains('is-open'));
    });

    backdrop.addEventListener('click', () => setMenu(false));

    nav.querySelectorAll('.nav__link').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        burger.focus();
      }
    });
  }

  // Back to top
  if (toTop) {
    const onScroll = () => {
      toTop.classList.toggle('is-visible', window.scrollY > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

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
