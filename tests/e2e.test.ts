import type { SummaryParams } from '../src/proxy.js'
import t from 'node:test'
import assert from 'node:assert'
import { OramaProxy } from '../src/proxy.js'
import 'dotenv/config.js'

const client = createProxy()

await t.test('secure proxy', async t => {

  await t.test('can generate summaries', async t => {
    const summaryParams: SummaryParams = {
      docIDs: ['3', '1', '2'],
      indexID: 'e2e-test-01',
      deploymentID: 'e2e-test-01',
      model: 'openai/gpt-3.5-turbo',
      prompt: 'Who is michael scott?'
    }

    const summary = await client.summary(summaryParams)

    console.log(summary)

    assert.ok(summary.length > 0)

  })

  await t.test('can generate openai embeddings', async t => {
    const embeddings = await client.generateEmbeddings('hello world', 'openai/text-embedding-ada-002')
    assert.equal(embeddings.length, 1536)
  })

  await t.test('can generate chat responses via gpt-3.5-turbo', async t => {
    const resp = await client.chat({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    assert.ok(resp.length > 0)
  })

  await t.test('can generate chat responses via gpt-3.5-turbo-16k', async t => {
    const resp = await client.chat({
      model: 'openai/gpt-3.5-turbo-16k',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    assert.ok(resp.length > 0)
  })

  await t.test('can generate chat responses via gpt-4', async t => {
    const resp = await client.chat({
      model: 'openai/gpt-4',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    assert.ok(resp.length > 0)
  })

  await t.test('can generate chat responses via gpt-4-1106-preview', async t => {
    const resp = await client.chat({
      model: 'openai/gpt-4-1106-preview',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    assert.ok(resp.length > 0)
  })

  await t.test('can stream chat responses via gpt-3.5-turbo', async t => {
    const resp = client.chatStream({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    for await (const message of resp) {
      assert.ok(message.length > 0)
    }
  })

  await t.test('can stream chat responses via gpt-3.5-turbo-16k', async t => {
    const resp = client.chatStream({
      model: 'openai/gpt-3.5-turbo-16k',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    for await (const message of resp) {
      assert.ok(message.length > 0)
    }
  })

  await t.test('can stream chat responses via gpt-4', async t => {
    const resp = client.chatStream({
      model: 'openai/gpt-4',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    for await (const message of resp) {
      assert.ok(message.length > 0)
    }
  })

  await t.test('can stream chat responses via gpt-4-1106-preview', async t => {
    const resp = client.chatStream({
      model: 'openai/gpt-4-1106-preview',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    for await (const message of resp) {
      assert.ok(message.length > 0)
    }
  })

  await t.test('can stream chat wait for /init', async t => {
    const client = createProxy()
    const resp = client.chatStream({
      model: 'openai/gpt-4-1106-preview',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    for await (const message of resp) {
      assert.ok(message.length > 0)
    }
  })
})

function createProxy() {
  return new OramaProxy({
    api_key: process.env.ORAMA_SECURE_PROXY_API_KEY_TEST || ''
  })
}
