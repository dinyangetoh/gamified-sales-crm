import { existsSync } from 'fs'
import { join } from 'path'

export function repoRootFromApi(): string {
  const fromSrc = join(__dirname, '../../..')
  if (existsSync(join(fromSrc, 'demo', 'users.json'))) return fromSrc
  return join(process.cwd(), '..')
}

export function demoDir(): string {
  return join(repoRootFromApi(), 'demo')
}

export function demoEventsDir(): string {
  return join(demoDir(), 'events')
}

export function demoUsersPath(): string {
  return join(demoDir(), 'users.json')
}

export function demoManifestPath(): string {
  return join(demoEventsDir(), 'manifest.json')
}
