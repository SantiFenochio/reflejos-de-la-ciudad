// src/lib/seo.ts
// Constantes, tipos y helpers SEO centralizados.
// Importar desde layouts y componentes.

export const SITE_NAME = 'Reflejos de la Ciudad';
export const SITE_URL  = 'https://reflejos-de-la-ciudad.vercel.app';
export const SITE_DESCRIPTION =
  'El semanario digital del barrio San Martín, Buenos Aires. Noticias de sociedad, deportes, cultura, política y más.';
export const SITE_LOCALE   = 'es_AR';
export const DEFAULT_OG_IMAGE = '/og-default.jpg'; // 1200×630px

// Secciones del diario — usadas para article:section y breadcrumbs
export const SECCIONES = [
  'Sociedad', 'Deportes', 'Salud', 'Educación', 'Seguridad',
  'Cultura', 'Economía', 'Vecinos', 'Política', 'Opiniones', 'Breves',
] as const;
export type Seccion = (typeof SECCIONES)[number];

// Props tipadas para el componente <SEO />
export interface SeoProps {
  title:          string;
  description:    string;
  canonicalURL?:  string;
  image?:         string;
  imageAlt?:      string;
  type?:          'website' | 'article';
  publishedTime?: string;   // ISO 8601
  modifiedTime?:  string;   // ISO 8601
  author?:        string;
  section?:       Seccion | string;
  tags?:          string[];
  noindex?:       boolean;
}

// Defaults seguros para páginas que no pasan props
export const DEFAULT_SEO: SeoProps = {
  title:       SITE_NAME,
  description: SITE_DESCRIPTION,
  type:        'website',
  noindex:     false,
};

/**
 * Construye props SEO para una nota/artículo.
 * Acepta overrides desde el campo seoOverride de Sanity.
 */
export function buildArticleSeo(article: {
  title:         string;
  excerpt:       string;
  slug:          string;
  mainImageUrl?: string;
  publishedAt:   string;
  updatedAt?:    string;
  author?:       string;
  section?:      string;
  tags?:         string[];
  seoOverride?:  Partial<SeoProps>;
}): SeoProps {
  return {
    title:         article.seoOverride?.title || article.title,
    description:   trimDescription(article.seoOverride?.description || article.excerpt),
    canonicalURL:  `${SITE_URL}/nota/${article.slug}`,
    image:         article.seoOverride?.image || article.mainImageUrl || DEFAULT_OG_IMAGE,
    imageAlt:      article.seoOverride?.imageAlt || `Foto: ${article.title} — ${SITE_NAME}`,
    type:          'article',
    publishedTime: article.publishedAt,
    modifiedTime:  article.updatedAt || article.publishedAt,
    author:        article.author || `Redacción ${SITE_NAME}`,
    section:       article.section,
    tags:          article.tags,
    noindex:       article.seoOverride?.noindex ?? false,
  };
}

/**
 * Construye props SEO para una página de sección.
 */
export function buildSectionSeo(seccion: string): SeoProps {
  return {
    title:        `${seccion} | ${SITE_NAME}`,
    description:  `Las últimas noticias de ${seccion} en el barrio San Martín. Actualidad local en ${SITE_NAME}.`,
    canonicalURL: `${SITE_URL}/seccion/${seccion.toLowerCase()}`,
    type:         'website',
    section:      seccion,
  };
}

/**
 * Recorta descripción a máx. 160 chars sin cortar palabras.
 */
export function trimDescription(text: string, max = 160): string {
  if (!text) return SITE_DESCRIPTION;
  if (text.length <= max) return text;
  return text.substring(0, max).replace(/\s+\S*$/, '') + '…';
}
