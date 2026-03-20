import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { createClient } from '@sanity/client'
import { LexoRank } from 'lexorank'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_TOKEN
const apiVersion = '2025-06-27'
const type = 'articulo'
const batchSize = 200

if (!projectId || !token) {
  console.error('Faltan SANITY_PROJECT_ID/PUBLIC_SANITY_PROJECT_ID o SANITY_TOKEN en .env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

async function patchBatch(docs, startRank) {
  let rank = startRank
  const tx = client.transaction()
  for (const doc of docs) {
    rank = rank.genNext().genNext()
    tx.patch(doc._id, { set: { orderRank: rank.toString() } })
  }
  const result = await tx.commit({ visibility: 'sync', tag: 'orderable-document-list.init-order-rank' })
  return { result, rank }
}

async function main() {
  const query = `*[_type == $type && !defined(orderRank)] | order(_createdAt asc) { _id, _createdAt }`
  const docs = await client.fetch(query, { type }, { tag: 'orderable-document-list.find-missing-order-rank' })

  if (!Array.isArray(docs) || docs.length === 0) {
    console.log('Documentos actualizados: 0')
    return
  }

  let updated = 0
  let currentRank = LexoRank.min()

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize)
    const { result, rank } = await patchBatch(batch, currentRank)
    currentRank = rank
    updated += result.results.length
  }

  console.log(`Documentos actualizados: ${updated}`)
}

main().catch((error) => {
  console.error('Error inicializando orderRank:', error)
  process.exit(1)
})
