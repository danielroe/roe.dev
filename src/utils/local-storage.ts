import { ref, Ref, watch, onMounted } from '#imports'

export const isString = (val: unknown): val is string => typeof val === 'string'
export const isClient = typeof window !== 'undefined'

function useLocalStorage<Data = any>(key: string): Ref<Data>
function useLocalStorage<Data = any>(
  key: string,
  defaultValue?: Data
): Ref<Data>
function useLocalStorage<Data = any>(
  key: string,
  defaultValue?: Data,
  raw?: boolean
): Ref<Data | undefined>

function useLocalStorage<Data = any>(
  key: string,
  defaultValue?: Data,
  raw?: boolean
) {
  function serializedValue(val: any): string {
    return raw ? String(val) : JSON.stringify(val)
  }

  const refVal = ref<Data | undefined>(defaultValue)

  onMounted(() => {
    try {
      const localStorageValue = localStorage.getItem(key)
      // not exists
      if (!isString(localStorageValue)) {
        localStorage.setItem(key, serializedValue(defaultValue))
      } else {
        refVal.value = raw
          ? localStorageValue
          : JSON.parse(localStorageValue || 'null')
      }
    } catch (e) {
      // eslint-disable-next-line
      console.warn(e)
    }

    watch(
      refVal,
      () => {
        try {
          localStorage.setItem(key, serializedValue(refVal.value))
        } catch (e) {
          // eslint-disable-next-line
          console.warn(e)
        }
      },
      { flush: 'sync', immediate: true }
    )
  })

  return refVal
}

export default useLocalStorage
