# Orama Cloud Client

## Install

```js
npm i @oramacloud/client
```

## Integrating with Orama Cloud

```js
import { OramaClient } from '@oramacloud/client'

const client = new OramaClient({
  endpoint: '<Your Orama Cloud Endpoint>',
  api_key: '<Your Orama Cloud API Key>'
})

const results = await client.search({
  term: 'red leather shoes',
})
```

## Advanced search

```js
const results = await client.search({
  term: 'red leather shoes',
  where: {
    price: {
      lte: 9.99
    },
    gender: 'unisex'
  },
  limit: 5,
  offset: 1
})
```

## Generating embeddings via the Secure Proxy

```js
import { OramaProxy } from '@oramacloud/client'

const proxy = new OramaClient({
  api_key: '<Your Orama Secure Proxy API Key>'
})

const embeddings = await proxy.generateEmbeddings('red leather shoes', 'openai/text-embedding-ada-002')

console.log(embeddings)
// [-0.019633075, -0.00820422, -0.013555876, -0.011825735, 0.006641511, -0.012948156, ...]
```

Available models:

- `openai/text-embedding-ada-002`. 1536 dimensions, proxied to OpenAI
- `orama/gte-small`. 384 dimensions, operated by Orama Cloud (preferred)

## Generating chat completions via the Secure Proxy

You can generate chat completions via the Secure Proxy in two different ways:

### Returning a single string

```js
import { OramaProxy } from '@oramacloud/client'

const proxy = new OramaClient({
  api_key: '<Your Orama Secure Proxy API Key>'
})

const chatParams = {
  model 'openai/gpt-4',
  messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
}

const response = await proxy.chat(chatParams)
console.log(response)

// "Michael Scott is a fictional character from the television show "The Office" (US version) ..."
```

Available models:

- `openai/gpt-4-1106-preview`
- `openai/gpt-4`
- `openai/gpt-3.5-turbo`
- `openai/gpt-3.5-turbo-16k`

### Returning a stream (via async iterators)

```js
import { OramaProxy } from '@oramacloud/client'

const proxy = new OramaClient({
  api_key: '<Your Orama Secure Proxy API Key>'
})

const chatParams = {
  model 'openai/gpt-4',
  messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
}

for await (const message of proxy.chatStream(chatParams)) {
  console.log(message)
}

// Michael
// Scott is
// a fictional
//  character from the
//  television show 
// "The
// Office" (US
// version)
// ...
```

Available models:

- `openai/gpt-4-1106-preview`
- `openai/gpt-4`
- `openai/gpt-3.5-turbo`
- `openai/gpt-3.5-turbo-16k`

## With React

```jsx
import { OramaCloud, useSearch } from '@oramacloud/client/react'

export function App() {
  return (
    <OramaCloud endpoint='<Your Orama Cloud Endpoint>' apiKey='<Your Orama Cloud API Key>'>
      <Search />
    </OramaCloud>
  )
}

function Search() {
  const { results, error } = useSearch({
    term: 'red leather shoes',
    limit: 10,
    offset: 5
  })

  return (
    <>
      {results.hits.map((hit) => {
        <div key={hit.id}>
          <p> {hit.document.myCustomProperty} </p>
        </div>
      })}
    </>
  )
}
```

## With Vue

### Set up Orama Cloud singleton

Create an orama.ts file in the src folder to create an Orama Cloud Client instance that you’ll use throughout your application.

```ts
import { OramaCloud } from '@oramacloud/client/vue'

export const orama = new OramaCloud({
  apiKey: '<Your Orama Cloud API Key>',
  endpoint: '<Your Orama Cloud Endpoint>'
})
```

### Use the client instance in your component

```jsx
<template>
  <li v-for="hit in searchResults?.hits" :key="hit.id">
    {{ hit.id }}
  </li>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { orama } from './orama'

const searchResults = ref(null)

onMounted(async () => {
  if (orama) {
    const { results, error } = await orama.search({
      term: 'guitar',
      limit: 5
    })

    searchResults.value = results
  }
})
</script>
```
