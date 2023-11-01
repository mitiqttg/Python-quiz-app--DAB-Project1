const { test, expect } = require("@playwright/test");

test("Feedback on correct submission", async ({ page }) => {

  await page.goto("/");
  expect(await page.title()).toBe("Programming Python");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  await page.getByRole('textbox').fill('def hello(): \n return "Hello";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Passed"]);
});

test("Give a new assignment if the first submission is passed", async ({ page }) => {
  
  await page.goto("/");
  expect(await page.title()).toBe("Programming Python");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  await page.getByRole('textbox').fill('def hello(): \n return "Hello";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Passed"]);
  await expect(page.getByText('Next')).toBeVisible();

  //Move to the next assignment
  await page.getByText('Next').click();
  await expect(page.locator("h1")).toHaveText("Hello world");
  await expect(page.locator("p")).toHaveText('Write a function "world" that returns the string "Hello world!"');

});

test("Feedback on incorrect submission", async ({ page }) => {

  await page.goto("/");
  expect(await page.title()).toBe("Programming Python");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  await page.getByRole('textbox').fill('def hello(): \n return "Hullo";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Failed"]);
});

test("User has 0 points after submitting first assignment incorrectly", async ({ page }) => {
  
  await page.goto("/");
  expect(await page.title()).toBe("Programming Python");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  await page.getByRole('textbox').fill('def hello(): \n return "Hullo";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Failed"]);
  await expect(page.getByText('0 point')).toBeVisible();

});

test("User has 100 points after submitting first assignment correctly", async ({ page }) => {
  
  await page.goto("/");
  expect(await page.title()).toBe("Programming Python");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  await page.getByRole('textbox').fill('def hello(): \n return "Hello";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Passed"]);
  await expect(page.getByText('100 point')).toBeVisible();

});