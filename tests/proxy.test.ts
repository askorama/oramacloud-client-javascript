import t from 'node:test'
import assert from 'node:assert'
import { OramaProxy } from '../src/index.js'

await t.test('client', async t => {

  const proxy = new OramaProxy({
    api_key: 'my-api-key',
  })

  await t.test('generateEmbeddings should return the result', async t => {
    const embeddings = await proxy.generateEmbeddings('foobar')

    assert.equal(0, embeddings.length)
  })
})
