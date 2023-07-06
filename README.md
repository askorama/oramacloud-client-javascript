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
import { useOramaCloud } from '@oramacloud/client/react'

const client = new OramaClient({
  endpoint: '<Your Orama Cloud Endpoint>',
  api_key: '<Your Orama Cloud API Key>'
})

export function MyComponent() {
  const { useSearch } = useOramaCloud({
    endpoint: '<Your Orama Cloud Endpoint>',
    api_key: '<Your Orama Cloud API Key>'
  })

  const { results } = useSearch({
    term: 'red leather shoes'
  })

  return (
    <>
      {results.hits.map((hit) => (
        <div key={hit.id}>
          <p>{hit.document.property}</p>
        </div>
      ))}
    </>
  )

}
```