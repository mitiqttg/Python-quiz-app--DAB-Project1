Run the following commands first
- In `grader-image` folder:
    `docker build -t grader-image .`
- In `programming-ui` folder:
    `npm install` 

In `programming-api` folder, start the development build with
    `docker compose up`

The production build can be started with this command in the root folder containing `docker-compose.prod.yml`
    `docker compose -f docker-compose.prod.yml up -d`
and removed with this command
    `docker compose down`
    
The application can be accessed at `http://localhost:7800/` (it may take a while to load the UI environment) 

The playwright end to end tests can be run with the command
    `docker compose run --entrypoint=npx e2e-playwright playwright test && docker-compose rm -sf`
Note: the maximum timeout for an expect-request is set to 20 seconds. Usually this is enough to get the grading result for a submission, but
sometimes grading is slower so it might be necessary to run the tests multiple times to get all of them to pass at once. The timeouts can be increased in `e2e-playwright/playwright.config.js`, but it might require rebuilding the container for the changes to take effect.

The k6 performance tests can be run with the following commands while the server is running.
- In the `k6` folder:
    `k6 run load-page-performance-test.js`          
    `k6 run submission-performance-test.js`  
