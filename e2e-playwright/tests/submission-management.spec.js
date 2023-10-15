const { test, expect } = require("@playwright/test");
// NEED TO MODIFY
test("Server gives right feedback on incorrect submission", async ({ page }) => {
  test.slow();

  await page.goto("/");
  expect(await page.title()).toBe("Programming assignments");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  //await page.locator("input[type=text]").type("incorrect submission");
  await page.getByRole('textbox').fill('def hello(): \n return "Hullo";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Submission failed"]);
});

test("Server gives right feedback on correct submission", async ({ page }) => {
  test.slow();

  await page.goto("/");
  expect(await page.title()).toBe("Programming assignments");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  //await page.locator("input[type=text]").type("incorrect submission");
  await page.getByRole('textbox').fill('def hello(): \n return "Hello";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Submission was correct"]);
});

test("Server gives a new assignment after correctly submitting first assignment", async ({ page }) => {
  test.slow();
  
  await page.goto("/");
  expect(await page.title()).toBe("Programming assignments");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  //await page.locator("input[type=text]").type("incorrect submission");
  await page.getByRole('textbox').fill('def hello(): \n return "Hello";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Submission was correct"]);
  await expect(page.getByText('Next', { exact: true })).toBeVisible();

  //Move to the next assignment
  await page.getByText('Next', { exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Hello world");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello world!"');

});

test("User has 0 points after submitting first assignment incorrectly", async ({ page }) => {
  test.slow();
  
  await page.goto("/");
  expect(await page.title()).toBe("Programming assignments");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  //await page.locator("input[type=text]").type("incorrect submission");
  await page.getByRole('textbox').fill('def hello(): \n return "Hullo";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Submission failed"]);
  await expect(page.locator("#userPoints")).toHaveText("0 points");

});

test("User has 100 points after submitting first assignment correctly", async ({ page }) => {
  test.slow();
  
  await page.goto("/");
  expect(await page.title()).toBe("Programming assignments");

  //Check that the server gives the first assignment
  await expect(page.locator("h1")).toHaveText("Hello");
  await expect(page.locator("p")).toHaveText('Write a function "hello" that returns the string "Hello"');

  //Create submission
  //await page.locator("input[type=text]").type("incorrect submission");
  await page.getByRole('textbox').fill('def hello(): \n return "Hello";');
  await page.getByRole('button').click();

  //Check that feedback is correct
  await expect(page.locator("p")).toHaveText(['Write a function "hello" that returns the string "Hello"', "Submission was correct"]);
  await expect(page.locator("#userPoints")).toHaveText("100 points");

});