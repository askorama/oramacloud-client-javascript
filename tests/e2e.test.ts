import t from 'node:test'
import assert from 'node:assert'
import { OramaProxy } from '../src/proxy.js'
import 'dotenv/config.js'

const client = new OramaProxy({
  api_key: process.env.ORAMA_SECURE_PROXY_API_KEY_TEST || ''
})

await t.test('secure proxy', async t => {
  await t.test('can generate openai embeddings', async t => {
    const embeddings = await client.generateEmbeddings('hello world', 'openai/text-embedding-ada-002')
    assert.equal(embeddings.length, 1536)
  })

  await t.test('can generate orama embeddings', async t => {
    const embeddings = await client.generateEmbeddings('hello world', 'orama/gte-small')
    assert.equal(embeddings.length, 384)
  })

  await t.test('can generate chat responses', async t => {
    const resp = await client.chat({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    assert.ok(resp.length > 0)
  })
})