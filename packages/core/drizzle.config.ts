import { defineConfig } from 'drizzle-kit'

import { databaseUrl } from './config'

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/schema.ts',
	out: './migrations',
	dbCredentials: {
		url: databaseUrl,
		database: 'postgres',
		port: 5432,
	},
	verbose: true,
	strict: true,

	schemaFilter: ['public'],
})
