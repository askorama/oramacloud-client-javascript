import type { SearchParams, Results, Nullable, Orama } from '@orama/orama'
import { inject, ref } from 'vue'
import type { App, Ref } from 'vue'
import { OramaClient } from '../client.js'

type OramaContextProvide = (clientData: { apiKey: string; endpoint: string }) => (app: App<Element>) => void

type OramaContextInject = () => { apiKey: string; endpoint: string }

interface IOramaCloudContext {
  endpoint: string
  apiKey: string
}

interface useSearchAttrs {
  clientData: IOramaCloudContext
  query: SearchParams
}

interface UseSearch {
  ready: boolean
  results: Nullable<Results>
  error: Nullable<Error>
}

export const oramaInjection: OramaContextInject = () => {
  const clientData: IOramaCloudContext | undefined = inject('OramaCloudContext')

  return clientData ?? { apiKey: '', endpoint: '' }
}

export const oramaProvide: OramaContextProvide =
  ({ apiKey, endpoint }) =>
  (app) => {
    app.provide('OramaCloudContext', {
      apiKey,
      endpoint,
    })
  }

export async function useSearch({ clientData, query }: useSearchAttrs): Promise<UseSearch> {
  const { apiKey, endpoint } = clientData
  const ready = ref(false)
  const client: Ref<Nullable<OramaClient>> = ref(null)
  const res: Ref<Nullable<Results>> = ref(null)
  const err: Ref<Nullable<Error>> = ref(null)

  client.value = new OramaClient({ api_key: apiKey, endpoint })
  ready.value = true

  try {
    const results = await client.value.search(query)
    res.value = results
  } catch (e: any) {
    err.value = e
  }

  return {
    ready: ready.value,
    results: res.value,
    error: err.value,
  }
}
