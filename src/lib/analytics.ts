// src/lib/analytics.ts
// Helper functions para tracking de eventos custom

/**
 * Track custom event en Google Analytics
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // @ts-ignore
    window.gtag('event', eventName, params);
  }
}

/**
 * Track vista de artículo
 */
export function trackArticleView(slug: string, category: string, title: string) {
  trackEvent('article_view', {
    article_slug: slug,
    article_category: category,
    article_title: title,
  });
}

/**
 * Track búsqueda
 */
export function trackSearch(query: string, resultsCount: number) {
  trackEvent('search', {
    search_term: query,
    results_count: resultsCount,
  });
}

/**
 * Track share de artículo
 */
export function trackShare(platform: string, url: string) {
  trackEvent('share', {
    method: platform,
    content_type: 'article',
    item_id: url,
  });
}

/**
 * Track click en publicidad
 */
export function trackAdClick(adName: string, position: string) {
  trackEvent('ad_click', {
    ad_name: adName,
    ad_position: position,
  });
}

/**
 * Track newsletter signup
 */
export function trackNewsletterSignup(email: string) {
  trackEvent('newsletter_signup', {
    method: 'footer_form',
  });
}
