// src/lib/queries.ts

// Últimas 7 noticias para la Home (hero + grilla de 6)
export const HOME_QUERY = `*[_type == "articulo"] | order(fechaPublicacion desc) [0...7] {
  _id,
  titulo,
  slug,
  bajada,
  categoria,
  fechaPublicacion,
  "imagen": imagenPrincipal,
  autor
}`

// Nota individual por slug
export const ARTICULO_QUERY = `*[_type == "articulo" && slug.current == $slug][0] {
  _id,
  titulo,
  slug,
  bajada,
  categoria,
  fechaPublicacion,
  "imagen": imagenPrincipal,
  imagenCaption,
  autor,
  cuerpo,
  "relacionadas": *[_type == "articulo" && categoria == ^.categoria && slug.current != $slug] | order(fechaPublicacion desc) [0...3] {
    titulo,
    slug,
    categoria,
    fechaPublicacion,
    "imagen": imagenPrincipal
  }
}`

// Notas por sección
export const SECCION_QUERY = `*[_type == "articulo" && lower(categoria) == $seccion] | order(fechaPublicacion desc) {
  _id,
  titulo,
  slug,
  bajada,
  categoria,
  fechaPublicacion,
  "imagen": imagenPrincipal,
  autor
}`
