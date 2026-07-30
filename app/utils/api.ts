import type { HTTPMethod, TypedFetchInput, TypedFetchRequestInit, TypedFetchResponseBody } from 'fetchdts'
import type { AsyncData, NuxtError, UseFetchOptions } from 'nuxt/app'
import type { MaybeRefOrGetter } from 'vue'

import type { PublicApi } from '#shared/types/api/schema'

/** Every path in the public API schema, optionally narrowed to one method. */
export type ApiPath<M extends HTTPMethod | '' = ''> = TypedFetchInput<PublicApi, M>

/** Response body the schema promises for a path and method. */
export type ApiResponse<
  P extends ApiPath,
  M extends HTTPMethod = 'GET',
> = TypedFetchResponseBody<PublicApi, P, M>

type MethodOf<Init> = Init extends { method: infer M extends HTTPMethod } ? M : 'GET'

type KeysOf<T> = Array<T extends T ? (keyof T extends string ? keyof T : never) : never>

/**
 * `$fetch` restricted to the public API schema. Nitro's generated `InternalApi`
 * types are inferred from handler return types, which erases the payload of
 * cached handlers; this reads the declared contract instead.
 */
export function apiFetch<
  const P extends ApiPath,
  const Init extends TypedFetchRequestInit<PublicApi, P>,
> (
  path: P,
  // Paths without a GET handler have to be given a `method`, so `init` is only
  // optional for the ones that do.
  ...[init]: P extends ApiPath<'GET'> ? [init?: Init] : [init: Init]
): Promise<ApiResponse<P, MethodOf<Init>>> {
  return $fetch(path as string, init as object) as Promise<ApiResponse<P, MethodOf<Init>>>
}

/**
 * `useFetch` for the public API schema. Only the response type is taken from
 * the schema; everything else (keying, SSR payload transfer, `transform`,
 * `default`, …) is `useFetch`'s own behaviour.
 */
export function useApiFetch<
  const P extends ApiPath<'GET'>,
  DataT = ApiResponse<P>,
> (
  path: MaybeRefOrGetter<P>,
  options: UseFetchOptions<ApiResponse<P>, DataT, KeysOf<DataT>, DataT> & { default: () => DataT },
): AsyncData<DataT, NuxtError | undefined>
export function useApiFetch<
  const P extends ApiPath<'GET'>,
  DataT = ApiResponse<P>,
> (
  path: MaybeRefOrGetter<P>,
  options?: UseFetchOptions<ApiResponse<P>, DataT, KeysOf<DataT>, undefined>,
): AsyncData<DataT | undefined, NuxtError | undefined>
export function useApiFetch<
  const P extends ApiPath<'GET'>,
  DataT = ApiResponse<P>,
> (
  path: MaybeRefOrGetter<P>,
  options?: UseFetchOptions<ApiResponse<P>, DataT>,
): AsyncData<DataT | undefined, NuxtError | undefined> {
  return useFetch(
    path as MaybeRefOrGetter<string>,
    options as UseFetchOptions<unknown>,
  ) as unknown as AsyncData<DataT | undefined, NuxtError | undefined>
}
