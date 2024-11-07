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

## Moncy's Decisions

I used one of my Remix starter kits as a template for this project. I'm not sure
if it's the best way to do it but it worked for me.

### Database design

#### Campaigns

Ok so I opt to create a separate table for campaigns and campaign schedules
because its not clear if a campaign can have multiple schedules but we can
change that later without much hassle.

#### Campaign Schedules

Start and end times are stored as plain strings with the format `HH:mm` because
Drizzle ORM is weird when it comes to storing time only values using a proper
time PG type.

day of week list is stored as an array of numbers where 0 = Sunday, 6 = Saturday
because MDN says that day of week is a number between 0 and 6 and Date methods
like `getDay()` return a number between 0 and 6.
