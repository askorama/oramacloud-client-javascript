import type { SearchParams, Results, Nullable, AnyDocument, AnyOrama } from '@orama/orama'
import React, { useState, useEffect, createContext, useContext } from 'react'
import { OramaClient } from '../client.js'

interface IOramaCloudContext {
  endpoint: string
  apiKey: string
}

interface UseSearch {
  ready: boolean
  results: Nullable<Results<AnyDocument>>
  error: Nullable<Error>
}

const OramaCloudContext = createContext<IOramaCloudContext>({
  endpoint: '',
  apiKey: ''
})

export const OramaCloud = ({
  children,
  endpoint,
  apiKey
}: {
  children: React.ReactNode
  endpoint: string
  apiKey: string
}): JSX.Element => {
  return <OramaCloudContext.Provider value={{ endpoint, apiKey }}>{children}</OramaCloudContext.Provider>
}

export function useSearch(query: SearchParams<AnyOrama>): UseSearch {
  const { apiKey, endpoint } = useContext(OramaCloudContext)
  const [ready, setReady] = useState<boolean>(false)
  const [client, setClient] = useState<Nullable<OramaClient>>(null)
  const [results, setResults] = useState<Nullable<Results<AnyDocument>>>(null)
  const [error, setError] = useState<Nullable<Error>>(null)

  useEffect(() => {
    setClient(new OramaClient({ api_key: apiKey, endpoint }))
    setReady(true)
  }, [])

  useEffect(() => {
    if (client !== null) {
      client.search(query).then(setResults).catch(setError)
    }
  }, [client, query])

  return {
    ready,
    results,
    error
  }
}
