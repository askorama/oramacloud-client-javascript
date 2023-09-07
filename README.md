# Orama Cloud Client

## Install

```js
npm i @oramacloud/client
```

## Usage

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

Create a orama.ts file in the src folder to create a Orama Cloud Client instance that you’ll use throughout your application.

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
