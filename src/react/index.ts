import type { SearchParams, Results, Nullable } from '@orama/orama'
import { useState, useEffect } from 'react'
import { OramaClient } from '../client.js'

interface UseOramaProps {
  endpoint: string
  api_key: string
}

export function useOramaCloud (props: UseOramaProps) {
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
    useSearch: useSearch(client!)
  }
}

function useSearch (client: OramaClient) {
  return (query: SearchParams) => {
    const [results, setResults] = useState<Results | null>(null)
    const [error, setError] = useState<Error | null>(null)

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
