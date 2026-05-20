// src/lib/queries.ts

// Hero + 5 secundarias + 8 grilla = 14 notas para la Home
// Excluye notas marcadas con noindex (drafts ocultos).
export const HOME_QUERY = `*[_type == "articulo" && (noindex != true)] | order(fechaPublicacion desc) [0...14] {
  _id,
  titulo,
  slug,
  bajada,
  categoria,
  fechaPublicacion,
  "imagen": imagenPrincipal,
  autor,
  featured
}`

// Destacadas: notas marcadas manualmente con featured == true en Sanity,
// para el carrusel "Destacadas" de la Home. Si no hay ninguna marcada,
// la Home cae de vuelta a las notas recientes (ver index.astro).
export const DESTACADAS_QUERY = `*[_type == "articulo" && featured == true && (noindex != true)] | order(fechaPublicacion desc) [0...8] {
  _id,
  titulo,
  slug,
  bajada,
  categoria,
  fechaPublicacion,
  "imagen": imagenPrincipal,
  autor
}`

// Nota individual por slug — incluye campos SEO (seoTitle, seoDescription,
// seoImage, noindex) y tags para enriquecer NewsArticle JSON-LD.
export const ARTICULO_QUERY = `*[_type == "articulo" && slug.current == $slug][0] {
  _id,
  _updatedAt,
  titulo,
  slug,
  bajada,
  categoria,
  fechaPublicacion,
  "imagen": imagenPrincipal,
  imagenCaption,
  autor,
  cuerpo,
  tags,
  seoTitle,
  seoDescription,
  "seoImage": seoImage,
  noindex,
  "relacionadas": *[_type == "articulo" && categoria == ^.categoria && slug.current != $slug && (noindex != true)] | order(fechaPublicacion desc) [0...3] {
    titulo,
    slug,
    categoria,
    fechaPublicacion,
    "imagen": imagenPrincipal
  }
}`

// Notas por sección — $seccion debe ser el valor EN MAYÚSCULAS tal como está en Sanity
// (ej: 'SOCIEDAD', 'DEPORTES', 'EDUCACIÓN'). Excluye noindex.
export const SECCION_QUERY = `*[_type == "articulo" && upper(categoria) == $seccion && (noindex != true)] | order(fechaPublicacion desc) {
  _id,
  titulo,
  slug,
  bajada,
  categoria,
  fechaPublicacion,
  "imagen": imagenPrincipal,
  autor
}`

// Publicidades activas por posición
export const PUBLICIDADES_QUERY = `*[_type == "publicidad" && activa == true && posicion == $posicion]
  | order(orden asc) {
    _id,
    nombre,
    linkDestino,
    posicion,
    "imagenUrl": imagen.asset->url
  }`
