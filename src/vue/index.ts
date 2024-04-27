import type { Results, Nullable, AnyDocument } from "@orama/orama";
import { OramaClient, ClientSearchParams } from "../client.js";
import { onMounted, ref, shallowRef, toValue, watchEffect } from "vue";
import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";
import { omit } from "lodash";
interface UseSearch {
  ready: Ref<boolean>;
  results: Ref<Nullable<Results<AnyDocument>>>;
  error: Ref<Nullable<Error>>;
}

type MaybeRef<T> = MaybeRefOrGetter<T> | ComputedRef<T>;
// type Client = Omit<OramaClient, "id"> & {
//   id: any;
// };

type Client = any;
type useSearchParams = {
  [key in keyof ClientSearchParams]: MaybeRef<ClientSearchParams[key]>;
} & {
  client: Client;
};

export function useSearch(query: useSearchParams): UseSearch {
  const ready = ref(false);
  const results: Ref<Nullable<Results<AnyDocument>>> = shallowRef(null);
  const error: Ref<Nullable<Error>> = ref(null);
  const client: Ref<any | undefined> = shallowRef();

  onMounted(() => {
    if (!query.client) {
      throw new Error("No client was passed");
    }
    ready.value = true;
    client.value = query.client;
  });

  watchEffect(() => {
    const valuedParams = Object.keys(omit(query, "client")).reduce(
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
