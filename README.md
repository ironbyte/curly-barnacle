# Nautikos

## Prequisities

- [Node 20 or later](https://github.com/nvm-sh/nvm)
- [PNPM](https://pnpm.io/installation#prerequisites)

## Set up a local development environment

- Git clone this repo
- Install dependencies with `pnpm install`
- Create a `.env` file based on the `.env.example` file and make sure the file
  is in the root of the project
- Run `docker-compose up -d` to start the database
- Run `pnpm drizzle:migrate` to run the database migrations
- Run `pnpm dev` to start the development server
- Verify that the app is running at `http://localhost:7221`
- You're good to go!
