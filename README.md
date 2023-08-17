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

### main.ts

```ts
import { oramaProvide } from '../../javascript-sdk/dist/vue'

oramaProvide({
  apiKey: 'AmXaJfsdKS5WY7qt5Qxvr8vw9etcQAsX',
  endpoint: 'https://cloud.orama.run/index/test-data-qvccn5'
})(app)
```

### Usage example

```jsx
<script setup>
import { ref, watch } from 'vue'
import { oramaInjection, useSearch } from '../../javascript-sdk/dist/vue'

const clientData = oramaInjection()
const searchResults = ref(null)
const inputValue = ref('')


watch(inputValue, async (oldValue, newValue) => {
  const oramaResults = await useSearch({
    clientData,
    query: {
      term: newValue,
      limit: 5,
    },
  })

  searchResults.value = oramaResults.results
})
</script>

<template>
  <input v-model="inputValue"/>
  <li v-for="hit in searchResults?.hits" :key="hit.id">
    {{ hit.id }}
  </li>
</template>
```
