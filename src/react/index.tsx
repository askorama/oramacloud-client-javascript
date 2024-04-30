import type { Results, Nullable, AnyDocument } from '@orama/orama'
import { OramaClient, ClientSearchParams } from '../client.js'
import React, { useState, useEffect, createContext, useContext } from 'react'

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

export function useSearch(query: ClientSearchParams): UseSearch {
  const { apiKey, endpoint } = useContext(OramaCloudContext)
  const [ready, setReady] = useState<boolean>(false)
  const [client, setClient] = useState<Nullable<OramaClient>>(null)
  const [results, setResults] = useState<Nullable<Results<AnyDocument>>>(null)
  const [error, setError] = useState<Nullable<Error>>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: only want to run this once
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
