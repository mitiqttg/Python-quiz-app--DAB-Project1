Run the following commands first

- In `grader-image` folder:
    `docker build -t grader-image .`

- In `programming-ui` folder:
    `npm install` 

- The production build can be started with this command in the root folder containing `docker-compose.prod.yml`
    `docker compose -f docker-compose.prod.yml up -d`
and removed with this command
    `docker compose down`

- In `programming-api` folder, start the development build with
    `docker compose up`
and removed with this command
    `docker compose down`

- Wait for this line in the docker terminal:
 `starterpj1-programming-api-1  | Listening on http://localhost:7777/`     
Then the  application can be accessed at `http://localhost:7800/` (it may take a while to load the UI environment) 

- The playwright end to end tests can be run with the command
    `docker compose run --entrypoint=npx e2e-playwright playwright test && docker-compose rm -sf`
The maximum waiting time for grading result can be increased in `e2e-playwright/playwright.config.js`. You may rebuilt all containers and images for it to work.

- The k6 performance tests can be run with the following commands while the server is running (make sure you have k6 installed, else install it with `winget install k6 --source winget`)
    In the `k6` folder:
        `k6 run load-page-performance-test.js`          
        `k6 run submission-performance-test.js`  
