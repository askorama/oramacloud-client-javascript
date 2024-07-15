import type { SummaryParams } from '../src/proxy.js'

import t from 'node:test'
import assert from 'node:assert'
import { OramaProxy } from '../src/proxy.js'
import { OramaClient } from '../src/client.js'
import { CloudManager } from '../src/manager/index.js'
import 'dotenv/config.js'

await t.test('secure proxy', async t => {

  await t.test('summaryStream should abort previous requests', async t => {
    const client = createProxy();
  
    const summaryStreamFirst = client.summaryStream({
      docIDs: ['3', '1', '2'],
      indexID: 'e2e-test-01',
      model: 'openai/gpt-3.5-turbo',
      prompt: 'Initial request'
    });
  
    const firstResponse = await summaryStreamFirst.next();
    assert.ok(!firstResponse.done && firstResponse.value, 'First request should yield data');
  
    const summaryStreamSecond = client.summaryStream({
      docIDs: ['4', '5', '6'],
      indexID: 'e2e-test-02',
      model: 'openai/gpt-3.5-turbo',
      prompt: 'Subsequent request'
    });
  
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the second stream to potentially yield data
  
    const secondResponse = await summaryStreamSecond.next();
    assert.ok(!secondResponse.done && secondResponse.value, 'Second request should yield data');
  
    const nextFirstResponse = await summaryStreamFirst.next();
    assert.ok(nextFirstResponse.done, 'First stream should be canceled');
  });

  await t.test('can generate summaries', async t => {
    const client = createProxy();

    const summaryParams: SummaryParams = {
      docIDs: ['3', '1', '2'],
      indexID: 'e2e-test-01',
      deploymentID: 'e2e-test-01',
      model: 'openai/gpt-3.5-turbo',
      prompt: 'Who is michael scott?'
    }

    const summary = await client.summary(summaryParams)

    assert.ok(summary.length > 0)

  })

  await t.test('can generate openai embeddings', async t => {
    const client = createProxy();

    const embeddings = await client.generateEmbeddings('hello world', 'openai/text-embedding-ada-002')
    assert.equal(embeddings.length, 1536)
  })

  await t.test('can generate chat responses via gpt-3.5-turbo', async t => {
    const client = createProxy();

    const resp = await client.chat({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    assert.ok(resp.length > 0)
  })

  await t.test('can generate chat responses via gpt-3.5-turbo-16k', async t => {
    const client = createProxy();

    const resp = await client.chat({
      model: 'openai/gpt-3.5-turbo-16k',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    assert.ok(resp.length > 0)
  })

  await t.test('can generate chat responses via gpt-4', async t => {
    const client = createProxy();

    const resp = await client.chat({
      model: 'openai/gpt-4',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    assert.ok(resp.length > 0)
  })

  await t.test('can generate chat responses via gpt-4-1106-preview', async t => {
    const client = createProxy();

    const resp = await client.chat({
      model: 'openai/gpt-4-1106-preview',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    assert.ok(resp.length > 0)
  })

  await t.test('can stream chat responses via gpt-3.5-turbo', async t => {
    const client = createProxy();

    const resp = client.chatStream({
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    for await (const message of resp) {
      assert.ok(message.length > 0)
    }
  })

  await t.test('can stream chat responses via gpt-3.5-turbo-16k', async t => {
    const client = createProxy();

    const resp = client.chatStream({
      model: 'openai/gpt-3.5-turbo-16k',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    for await (const message of resp) {
      assert.ok(message.length > 0)
    }
  })

  await t.test('can stream chat responses via gpt-4', async t => {
    const client = createProxy();

    const resp = client.chatStream({
      model: 'openai/gpt-4',
      messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
    })

    for await (const message of resp) {
      assert.ok(message.length > 0)
    }
  })

  await t.test('can stream chat responses via gpt-4-1106-preview', async t => {
    const client = createProxy();

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

await t.test('answer session', async t => {

  if (!process.env.ORAMA_E2E_ENDPOINT || !process.env.ORAMA_E2E_API_KEY) {
    t.skip('ORAMA_E2E_ENDPOINT and ORAMA_E2E_API_KEY are not set. E2e tests will be skipped.')
    return
  }

  const client = new OramaClient({
    endpoint: process.env.ORAMA_E2E_ENDPOINT!,
    api_key: process.env.ORAMA_E2E_API_KEY!
  })

  await t.test('can create an answer session', async t => {
    const session = client.createAnswerSession()

    const answer = await session.ask({
      term: 'german'
    })
    assert.ok(answer.length > 0)
  })
})

await t.test('answer session - related queries', async t => {

  if (!process.env.ORAMA_E2E_ENDPOINT || !process.env.ORAMA_E2E_API_KEY) {
    t.skip('ORAMA_E2E_ENDPOINT and ORAMA_E2E_API_KEY are not set. E2e tests will be skipped.')
    return
  }

  const client = new OramaClient({
    endpoint: process.env.ORAMA_E2E_ENDPOINT!,
    api_key: process.env.ORAMA_E2E_API_KEY!
  })

  await t.test('can get related queries', async t => {
    const session = client.createAnswerSession({
      events: {
        onRelatedQueries: (queries) => {
          assert.ok(queries.length === 3)
        }
      }
    })

    await session.ask({
      term: 'german',
      related: {
        howMany: 3,
        format: 'query',
      }
    })
  })
})

await t.test('can use the manager APIs', async t => {
  if (!process.env.ORAMA_E2E_ENDPOINT || !process.env.ORAMA_E2E_API_KEY || !process.env.ORAMA_E2E_PRIVATE_API_KEY || !process.env.ORAMA_E2E_INDEX_ID) {
    t.skip('One or more of ORAMA_E2E_ENDPOINT, ORAMA_E2E_API_KEY, ORAMA_E2E_PRIVATE_API_KEY, ORAMA_E2E_INDEX_ID are not set. E2e tests will be skipped.')
    return
  }

  const manager = new CloudManager({
    api_key: process.env.ORAMA_E2E_PRIVATE_API_KEY!
  })

  const indexManager = manager.index(process.env.ORAMA_E2E_INDEX_ID)

  await t.test('should be able to empty the index', async t => {
    const isEmpty = await indexManager.empty()
    assert.ok(isEmpty)
  })

  await t.test('should be able to insert some data', async t => {
    const success = await indexManager.insert([
      {
        id: '1',
        breed: "Orama Retriever",
        country: "Italy",
        longevity: 100,
        character: [
          "Easy to use",
          "Fast",
        ],
        colors: {
          fur: [],
          eyes: []
        }
      },
      {
        id: '2',
        breed: "To be removed",
        country: "Italy",
        longevity: 100,
        character: [],
        colors: {
          fur: [],
          eyes: []
        }
      }
    ])
    assert.ok(success)
  })

  await t.test('should be able to remove some data', async t => {
    const success = await indexManager.delete([
      {
        id: '2'
      }
    ])
    assert.ok(success)
  })

  await t.test('should be able to deploy the index', async t => {
    const success = await indexManager.deploy()
    assert.ok(success)
  })
})