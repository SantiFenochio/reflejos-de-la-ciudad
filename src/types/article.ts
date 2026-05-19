// src/types/article.ts

export interface Articulo {
  _id:              string
  _updatedAt?:      string   // ISO — fecha de última edición en Sanity (para modifiedTime SEO)
  titulo:           string
  slug:             { current: string }
  bajada:           string
  categoria:        string
  fechaPublicacion: string
  imagen?:          any
  imagenCaption?:   string
  autor:            string
  cuerpo?:          any[]
  featured?:        boolean  // marcada manualmente como destacada en Sanity
  relacionadas?:    Partial<Articulo>[]
}
