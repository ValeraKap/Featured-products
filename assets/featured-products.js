/**
 * Featured Products section
 * - Fetches product recommendations via Section Rendering API
 * - Fallback to section settings when no recommendations
 * - Vanilla JS
 */
(function () {
  const RECOMMENDATIONS_LIMIT = 10;

  function initFeaturedProducts() {
    const sections = document.querySelectorAll('[id^="FeaturedProducts-"]');
    sections.forEach((section) => {
      const productId = section.dataset.productId;
      const sectionId = section.dataset.sectionId;
      const url = section.dataset.recommendationsUrl || (typeof window !== 'undefined' && window.location ? window.location.origin + '/recommendations/products' : '');

      if (!productId || !sectionId || !url) return;

      fetchRecommendations(section, productId, sectionId, url);
      initHeaderNavButtons(section);
    });
  }

  function fetchRecommendations(section, productId, sectionId, url) {
    const params = new URLSearchParams({
      product_id: productId,
      section_id: sectionId,
      limit: RECOMMENDATIONS_LIMIT,
      intent: 'related'
    });

    fetch(`${url}?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error('Recommendations fetch failed');
        return response.text();
      })
      .then((html) => {
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
            initSliderComponent(section);
          }
        }
      })
      .catch(() => {
        // Keep existing content (fallback products or placeholder)
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
    const slider = section.querySelector('[id^="Slider-"]');

    if (!slider || !prevBtn || !nextBtn) return;

    function getScrollAmount() {
      const slides = slider.querySelectorAll('[id^="Slide-"]');
      const visibleSlides = Array.from(slides).filter((el) => el.offsetWidth > 0);
      if (visibleSlides.length < 2) return slider.offsetWidth;
      return visibleSlides[1].offsetLeft - visibleSlides[0].offsetLeft;
    }

    prevBtn.addEventListener('click', () => {
      const amount = getScrollAmount();
      slider.scrollTo({ left: slider.scrollLeft - amount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      const amount = getScrollAmount();
      slider.scrollTo({ left: slider.scrollLeft + amount, behavior: 'smooth' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeaturedProducts);
  } else {
    initFeaturedProducts();
  }
})();
