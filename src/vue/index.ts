import type { Results, Nullable, AnyDocument } from "@orama/orama";
import { OramaClient, ClientSearchParams } from "../client.js";
import { onMounted, ref, shallowRef, toValue, watchEffect } from "vue";
import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";
import { omit } from "lodash";
import { IOramaClient } from "../types.js";
interface UseSearch {
  ready: Ref<boolean>;
  results: Ref<Nullable<Results<AnyDocument>>>;
  error: Ref<Nullable<Error>>;
}

type MaybeRef<T> = MaybeRefOrGetter<T> | ComputedRef<T>;
type useSearchParams = {
  [key in keyof ClientSearchParams]: MaybeRef<ClientSearchParams[key]>;
} & {
  cloudConfig: IOramaClient;
};

export function useSearch(query: useSearchParams): UseSearch {
  const ready = ref(false);
  const results: Ref<Nullable<Results<AnyDocument>>> = shallowRef(null);
  const error: Ref<Nullable<Error>> = ref(null);
  const client: Ref<OramaClient | undefined> = shallowRef();

  onMounted(() => {
    if (!query.cloudConfig) {
      throw new Error("No config was passed");
    }
    ready.value = true;
    client.value = new OramaClient(query.cloudConfig);
  });

  watchEffect(() => {
    const valuedParams = Object.keys(omit(query, "cloudConfig")).reduce(
      (acc: any, curr) => {
        const currTyped = curr as keyof useSearchParams;
        acc[currTyped] = toValue(query[currTyped]);

        return acc;
      },
      {}
    ) as ClientSearchParams;

    if (client.value) {
      (client.value as OramaClient)
        .search(valuedParams)
        .then((res) => {
          results.value = res;
          console.log("updated results");
        })
        .catch((e) => (error.value = e));
    }
  });

  return {
    ready,
    results,
    error,
  };
}
