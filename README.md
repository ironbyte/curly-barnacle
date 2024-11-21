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

## Moncy's Thoughts/Decisions

Hey ok, the assignment was pretty fun. Didnt expect it to be this long. I
couldnt finish everything in 4 hours max even though I used one of my Remix
starter kits as a template for this project. I had to leave the logic for
calculating the next scheduled campaign date in the `index.tsx` **file**
unfinished. It was about 70% done but I didnt have time to finish it.

I managed to complete the following features:

- Create a new campaign
- Edit a campaign
- Table with campaigns and campaign schedules

About calculating the next scheduled campaign date:

I would use a loop to iterate through the days of the week starting from
tomorrow (Have to take care to make sure to make sure the loop doesnt go past
the end date) and check if the campaign is scheduled. If it is scheduled, return
the date.

Regarding the start and end times, they are simple time components without a
timezone. For this assignment (Not enough time), we will assume the timezone is
the user's local timezone. However, start and end dates are stored in the UTC
timezone in the database and will be displayed on the frontend in the user's
local timezone.

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
