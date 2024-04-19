import type { Results, Nullable, AnyDocument } from '@orama/orama'
import { OramaClient, type ClientSearchParams } from '../client.js'
import { Ref, onMounted, ref } from 'vue'

interface UseSearch {
  ready: Ref<boolean>
  results: Ref<Nullable<Results<AnyDocument>>>
  error: Ref<Nullable<Error>>
}

type useSearchParams = ClientSearchParams & { client: Omit<OramaClient, 'id'> }

export function useSearch(query: useSearchParams): UseSearch {
  const ready = ref(false)
  const results: Ref<Nullable<Results<AnyDocument>>> = ref(null)
  const error: Ref<Nullable<Error>> = ref(null)

  onMounted(async () => {
    if (!query.client) {
      throw new Error('No client was passed')
    }
    ready.value = true

    try {
      const oramaResults = await query.client?.search(query)
      results.value = oramaResults
    } catch (e: any) {
      error.value = e
    }
  })

  return {
    ready,
    results,
    error
  }
}
