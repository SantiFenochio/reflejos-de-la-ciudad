// sanity/components/AutoSlugInput.tsx
//
// Custom input para el campo "slug" que auto-genera el slug a partir del
// título a medida que el editor escribe, sin necesidad de clickear "Generate".
//
// Comportamiento:
//   - Mientras el slug está vacío o coincide con la última versión auto-generada,
//     se sincroniza automáticamente con el título.
//   - Si el editor escribe manualmente algo en el slug, deja de auto-sincronizar
//     (respeta la edición manual).
//   - El botón "Generate" nativo de Sanity sigue funcionando como fallback.

import { useEffect, useRef } from 'react'
import { set, SlugInput, useFormValue, type SlugInputProps } from 'sanity'

function slugify(input: string, maxLength = 96): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // saca acentos
    .replace(/[^a-z0-9]+/g, '-')     // todo lo no alfanumérico -> guion
    .replace(/^-+|-+$/g, '')         // recorta guiones extremos
    .slice(0, maxLength)
    .replace(/-+$/g, '')             // por si el recorte dejó guion al final
}

export default function AutoSlugInput(props: SlugInputProps) {
  const titulo = useFormValue(['titulo']) as string | undefined
  const currentSlug = props.value?.current
  const lastAutoSlugRef = useRef<string | undefined>(currentSlug)

  useEffect(() => {
    if (!titulo) return
    const next = slugify(titulo)
    if (!next) return

    // Auto-sync sólo si el slug está vacío o sigue siendo el último auto-generado
    // (es decir, el editor no lo tocó manualmente).
    const userEdited = currentSlug && currentSlug !== lastAutoSlugRef.current
    if (userEdited) return

    if (next === currentSlug) return

    lastAutoSlugRef.current = next
    props.onChange(set({ _type: 'slug', current: next }))
  }, [titulo])

  return <SlugInput {...props} />
}
