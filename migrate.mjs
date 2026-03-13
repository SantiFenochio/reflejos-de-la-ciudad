import 'dotenv/config'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'k3agywgt',
  dataset:   'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_TOKEN,
  useCdn:    false,
})

const noticias = [
  {
    _type: 'articulo',
    titulo: 'Ensamble Espacio Coral – 20° aniversario',
    slug: { _type: 'slug', current: 'ensamble-espacio-coral-20-aniversario' },
    bajada: 'Para celebrar las dos décadas, ofrecerá variados conciertos con un amplio repertorio.',
    categoria: 'CULTURA',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-17T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a1', style: 'normal', children: [{ _type: 'span', _key: 'b1', text: 'Para celebrar las dos décadas, ofrecerá variados conciertos con un amplio repertorio.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'San Martín preside la Juventud Radical de la 1ra. Sección',
    slug: { _type: 'slug', current: 'san-martin-preside-juventud-radical' },
    bajada: 'Carolina Lencina es la nueva conductora.',
    categoria: 'POLÍTICA',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-14T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a2', style: 'normal', children: [{ _type: 'span', _key: 'b2', text: 'Carolina Lencina es la nueva conductora de la Juventud Radical de la primera sección electoral.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Vuelve Expo Ciudad PyME',
    slug: { _type: 'slug', current: 'vuelve-expo-ciudad-pyme' },
    bajada: 'La feria de pequeñas y medianas empresas vuelve a Villa Ballester.',
    categoria: 'ECONOMÍA',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-16T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a3', style: 'normal', children: [{ _type: 'span', _key: 'b3', text: 'La feria de pequeñas y medianas empresas vuelve a Villa Ballester con nueva edición.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Reunión por la inseguridad en la CESM',
    slug: { _type: 'slug', current: 'reunion-inseguridad-cesm' },
    bajada: 'Vecinos, comerciantes y autoridades policiales intercambiaron información por el aumento de la inseguridad en Villa Ballester.',
    categoria: 'SEGURIDAD',
    autor: 'Sebastián Cejas',
    fechaPublicacion: '2025-04-17T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a4', style: 'normal', children: [{ _type: 'span', _key: 'b4', text: 'Vecinos, comerciantes y autoridades policiales intercambiaron información por el aumento de la inseguridad en Villa Ballester.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Deporte, integración social y valores para los chicos de San Martín',
    slug: { _type: 'slug', current: 'deporte-integracion-social-chicos' },
    bajada: 'Ya comenzaron la Escuela de Orientación Deportiva y el Programa de Formación Motriz.',
    categoria: 'DEPORTES',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-17T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a5', style: 'normal', children: [{ _type: 'span', _key: 'b5', text: 'Ya comenzaron la Escuela de Orientación Deportiva y el Programa de Formación Motriz, que en conjunto buscan integrar a los chicos del partido.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Espacio Abierto: Un rumbo distinto para San Martín',
    slug: { _type: 'slug', current: 'espacio-abierto-rumbo-san-martin' },
    bajada: 'Por un San Martín distinto, los representantes del possismo trabajan con nuevas propuestas.',
    categoria: 'POLÍTICA',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-16T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a6', style: 'normal', children: [{ _type: 'span', _key: 'b6', text: 'Por un San Martín distinto, los representantes del possismo en San Martín trabajan nutriéndose de nuevas ideas y propuestas.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Carnacini, ética, humildad y honestidad',
    slug: { _type: 'slug', current: 'carnacini-etica-humildad-honestidad' },
    bajada: 'Una charla de Dobal, organizada por la Cooperadora del Museo, recordó la vida del artista.',
    categoria: 'CULTURA',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-14T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a7', style: 'normal', children: [{ _type: 'span', _key: 'b7', text: 'Una charla de Dobal, organizada por la Cooperadora del Museo, recordó la vida y obra del artista Carnacini.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Moreira y Katopodis recorrieron las obras de las avenidas Juan B. Justo',
    slug: { _type: 'slug', current: 'moreira-katopodis-obras-avenidas' },
    bajada: 'Ambos trabajos de puesta en valor forman parte del Plan Municipal de Remodelación Integral.',
    categoria: 'SOCIEDAD',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-11T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a8', style: 'normal', children: [{ _type: 'span', _key: 'b8', text: 'Ambos trabajos de puesta en valor forman parte del Plan Municipal de Remodelación Integral de las principales arterias del partido.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Música por Bahía Blanca',
    slug: { _type: 'slug', current: 'musica-por-bahia-blanca' },
    bajada: 'Concierto solidario en apoyo a las víctimas de las inundaciones.',
    categoria: 'CULTURA',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-14T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a9', style: 'normal', children: [{ _type: 'span', _key: 'b9', text: 'Músicos locales organizaron un concierto solidario en apoyo a las víctimas de las inundaciones de Bahía Blanca.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Por la seguridad en San Martín',
    slug: { _type: 'slug', current: 'por-la-seguridad-san-martin' },
    bajada: 'Moreira se reunió con las nuevas autoridades policiales del partido.',
    categoria: 'SEGURIDAD',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-10T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a10', style: 'normal', children: [{ _type: 'span', _key: 'b10', text: 'El intendente Moreira se reunió con las nuevas autoridades policiales para tratar el aumento de la inseguridad en el partido.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Reabrió el Archivo Witcomb renovado y con página WEB',
    slug: { _type: 'slug', current: 'reabrio-archivo-witcomb-renovado' },
    bajada: 'Con nuevas propuestas y proyectos, el Archivo, uno de los 7 que existen en la provincia.',
    categoria: 'CULTURA',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-08T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a11', style: 'normal', children: [{ _type: 'span', _key: 'b11', text: 'Con nuevas propuestas y proyectos, el Archivo Witcomb, uno de los 7 que existen en la provincia, reabrió sus puertas completamente renovado.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'El Conejo de Pascua en tu barrio',
    slug: { _type: 'slug', current: 'conejo-pascua-barrio' },
    bajada: 'La celebración de Pascua llega a los centros comerciales de San Martín.',
    categoria: 'SOCIEDAD',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-11T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a12', style: 'normal', children: [{ _type: 'span', _key: 'b12', text: 'La celebración de Pascua llega a los centros comerciales y barrios de San Martín con actividades para los más chicos.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Refuerzo contra el sarampión',
    slug: { _type: 'slug', current: 'refuerzo-vacunacion-sarampion' },
    bajada: 'En toda la provincia de Buenos Aires comenzó la campaña de vacunación.',
    categoria: 'SALUD',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-10T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a13', style: 'normal', children: [{ _type: 'span', _key: 'b13', text: 'En toda la provincia de Buenos Aires comenzó la campaña de vacunación contra el sarampión para todos los grupos etarios.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Nueva plaza Paseo del Periodista, un logro conjunto',
    slug: { _type: 'slug', current: 'nueva-plaza-paseo-periodista' },
    bajada: 'La nueva plaza del barrio fue inaugurada con la presencia de vecinos y autoridades.',
    categoria: 'SOCIEDAD',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-01T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a14', style: 'normal', children: [{ _type: 'span', _key: 'b14', text: 'La nueva plaza Paseo del Periodista fue inaugurada con la presencia de vecinos y autoridades municipales.' }], markDefs: [] }]
  },
  {
    _type: 'articulo',
    titulo: 'Toti Ciliberto, un grande del humor argentino',
    slug: { _type: 'slug', current: 'toti-ciliberto-humor-argentino' },
    bajada: 'Homenaje al reconocido humorista en el Centro Cultural de San Martín.',
    categoria: 'CULTURA',
    autor: 'Redacción Reflejos',
    fechaPublicacion: '2025-04-01T00:00:00Z',
    cuerpo: [{ _type: 'block', _key: 'a15', style: 'normal', children: [{ _type: 'span', _key: 'b15', text: 'El Centro Cultural de San Martín rindió homenaje a Toti Ciliberto, uno de los grandes del humor popular argentino.' }], markDefs: [] }]
  },
]

async function migrate() {
  console.log(`Migrando ${noticias.length} artículos a Sanity...`)
  for (const noticia of noticias) {
    try {
      const result = await client.create(noticia)
      console.log(`✅ Creado: ${noticia.titulo}`)
    } catch (err) {
      console.log(`❌ Error en "${noticia.titulo}": ${err.message}`)
    }
  }
  console.log('Migración completa.')
}

migrate()
