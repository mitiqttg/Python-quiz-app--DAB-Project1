FROM mcr.microsoft.com/playwright:v1.31.1-focal

COPY . /e2e-playwright

WORKDIR /e2e-playwright

RUN npm install

CMD [ "npx", "playwright", "test", "--reporter=list" ]