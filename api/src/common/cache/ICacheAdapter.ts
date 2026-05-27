export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  setNX(key: string, ttlSeconds: number): Promise<boolean>
}

export const CACHE_ADAPTER = Symbol('CACHE_ADAPTER')
