import { drizzle } from 'drizzle-orm/postgres-js'

import { databaseUrl } from '../config'
import * as schema from './schema'

export const db = drizzle(databaseUrl, {
	schema: schema,
})

export type DB = typeof db
