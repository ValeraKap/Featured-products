/**
 * Featured Products section
 * - Fetches product recommendations via Section Rendering API
 * - Fallback to section settings when no recommendations
 * - Vanilla JS
 */
(function () {
  const DEFAULT_RECOMMENDATIONS_LIMIT = 10;

  function initFeaturedProducts() {
    const sections = document.querySelectorAll('[id^="FeaturedProducts-"]');
    sections.forEach((section) => {
      const productId = section.dataset.productId;
      const sectionId = section.dataset.sectionId;
      const url = section.dataset.recommendationsUrl || (typeof window !== 'undefined' && window.location ? window.location.origin + '/recommendations/products' : '');
      const allowAuto = section.dataset.allowAutoRecommendations !== 'false';
      const hasPlaceholder = section.querySelector('[data-featured-products-placeholder]');
      const limit = parseInt(section.dataset.recommendationsLimit, 10) || DEFAULT_RECOMMENDATIONS_LIMIT;

      if (!productId || !sectionId || !url) return;

      if (!allowAuto) {
        if (hasPlaceholder) {
          const text = section.querySelector('.featured-products__placeholder-text');
          if (text) text.textContent = 'There are no recommendations or the collection has 0 active products. Add a fallback collection or set recommendations in Search & Discovery.';
        } else {
          shuffleSectionIfEnabled(section);
        }
        initHeaderNavButtons(section);
        return;
      }

      fetchRecommendations(section, productId, sectionId, url, limit);
      initHeaderNavButtons(section);
    });
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function shuffleSectionIfEnabled(section) {
    if (section.dataset.shuffleRecommendations !== 'true') return;
    const slider = section.querySelector('[id^="Slider-"]');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll(':scope > li'));
    if (slides.length > 1) shuffleArray(slides).forEach((el) => slider.appendChild(el));
  }

  function fetchRecommendations(section, productId, sectionId, url, limit) {
    const recommendationsLimit = Math.min(10, Math.max(4, limit || DEFAULT_RECOMMENDATIONS_LIMIT));
    const params = new URLSearchParams({
      product_id: productId,
      section_id: sectionId,
      limit: recommendationsLimit,
      intent: 'related'
    });
    params.set('_', Date.now());

    fetch(`${url}?${params}`, { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) throw new Error('Recommendations fetch failed');
        return response.text();
      })
      .then((html) => {
        if (!html || html.trim().length === 0) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newSection = doc.querySelector(`[id^="FeaturedProducts-"]`);

        if (newSection) {
          const content = section.querySelector('[id^="FeaturedProductsContent-"]');
          const newContent = newSection.querySelector('[id^="FeaturedProductsContent-"]');

          if (!content || !newContent) return;

          const hasPlaceholder = newContent.querySelector('[data-featured-products-placeholder]');
          const newCards = newContent.querySelectorAll('.featured-products__card');
          const currentCards = content.querySelectorAll('.featured-products__card');

          if (hasPlaceholder && newCards.length === 0) {
            return;
          }

          if (currentCards.length > 0 && newCards.length < currentCards.length) {
            return;
          }

          if (newContent.innerHTML.trim().length > 0) {
            content.innerHTML = newContent.innerHTML;
            if (section.dataset.shuffleRecommendations === 'true') {
              const slider = content.querySelector('[id^="Slider-"]');
              if (slider) {
                const slides = Array.from(slider.querySelectorAll(':scope > li'));
                if (slides.length > 1) {
                  shuffleArray(slides).forEach((el) => slider.appendChild(el));
                }
              }
            }
            initSliderComponent(section);
          }
        }
      })
      .catch(() => {
        const placeholder = section.querySelector('[data-featured-products-placeholder]');
        if (placeholder) {
          const text = placeholder.querySelector('.featured-products__placeholder-text');
          if (text) text.textContent = 'Recommendations unavailable in this preview.';
        }
      });
  }

  function initSliderComponent(section) {
    const sliderComponent = section.querySelector('slider-component');
    if (sliderComponent && typeof customElements !== 'undefined') {
      const SliderComponent = customElements.get('slider-component');
      if (SliderComponent) {
        // Re-initialize if needed after innerHTML replace
        const newSlider = section.querySelector('slider-component');
        if (newSlider && !newSlider._initialized) {
          newSlider._initialized = true;
        }
      }
    }
  }

  function initHeaderNavButtons(section) {
    const prevBtn = section.querySelector('.featured-products__nav-btn--prev');
    const nextBtn = section.querySelector('.featured-products__nav-btn--next');
    if (!prevBtn || !nextBtn) return;

    function scroll(direction) {
      const slider = section.querySelector('[id^="Slider-"]');
      if (!slider) return;
      const slides = slider.querySelectorAll('[id^="Slide-"]');
      const visibleSlides = Array.from(slides).filter((el) => el.offsetWidth > 0);
      const amount = visibleSlides.length < 2 ? slider.offsetWidth : visibleSlides[1].offsetLeft - visibleSlides[0].offsetLeft;
      const left = direction === 'next' ? slider.scrollLeft + amount : slider.scrollLeft - amount;
      slider.scrollTo({ left, behavior: 'smooth' });
    }

    prevBtn.addEventListener('click', () => scroll('prev'));
    nextBtn.addEventListener('click', () => scroll('next'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeaturedProducts);
  } else {
    initFeaturedProducts();
  }
})();
