import type { SearchParams, Results, Nullable } from '@orama/orama'
import { useState, useEffect } from 'react'
import { OramaClient } from '../client.js'

interface UseOramaProps {
  endpoint: string
  api_key: string
}

interface UseOramaCloud {
  ready: boolean
  useSearch: (query: SearchParams) => UseSearch
}

interface UseSearch {
  results: Nullable<Results>
  error: Nullable<Error>
}

export function useOramaCloud (props: UseOramaProps): UseOramaCloud {
  const [client, setClient] = useState<Nullable<OramaClient>>(null)

  useEffect(() => {
    const client = new OramaClient({
      endpoint: props.endpoint,
      api_key: props.api_key
    })
    setClient(client)
  }, [])

  return {
    ready: client !== null,
    useSearch: useSearch(client as OramaClient)
  }
}

function useSearch (client: OramaClient): (query: SearchParams) => UseSearch {
  return (query: SearchParams) => {
    const [results, setResults] = useState<Nullable<Results>>(null)
    const [error, setError] = useState<Nullable<Error>>(null)

    useEffect(() => {
      if (client !== null) {
        client.search(query)
          .then(setResults)
          .catch(setError)
      }
    }, [client, query])

    return {
      results,
      error
    }
  }
}
