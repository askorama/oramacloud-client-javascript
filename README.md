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