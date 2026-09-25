import { test, expect } from "@playwright/test";
import {
  openRegistrationForm,
  fillRegistrationForm,
} from "./helpers/registration";

test("REG-01: Open registration modal @smoke @navigation", async ({ page }) => {
  await openRegistrationForm(page);

  await expect(page.getByText("Реєстрація")).toBeVisible();
  await expect(page.getByText("Керівник")).toBeVisible();
  await expect(page.getByText("Відвідувач")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Прізвище" })).toBeVisible();
  await expect(page.getByText("Ім`я")).toBeVisible();
  await expect(page.getByText("Телефон")).toBeVisible();
  await expect(page.getByText("Email")).toBeVisible();
  await expect(page.getByText("Пароль")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Підтвердження паролю" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Зареєструватися" }),
  ).toBeVisible();
  await expect(page.locator(".ant-radio-button").first()).toBeChecked();
});

test("REG-02 — Submit button disabled on empty form @smoke @validation @ui-state", async ({
  page,
}) => {
  await openRegistrationForm(page);

  await expect(
    page.getByRole("button", { name: "Зареєструватися" }),
  ).toBeDisabled();
});

// Run REG-03 then REG-03b in order; share credentials between them.
test.describe.serial("REG-03 → REG-03b", () => {
  const password = "Test123!";
  let email = "";

  test("REG-03 — Successful registration @smoke @happy-path", async ({
    page,
  }) => {
    email = `test${Date.now()}@example.com`;

    await openRegistrationForm(page);
    await fillRegistrationForm(page, email);
    await page.getByRole("button", { name: "Зареєструватися" }).click();

    await expect(page.getByText(/зареєструвалися/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Реєстрація")).not.toBeVisible();
  });

  test("REG-03b — Login after registration @optional @login", async ({
    page,
  }) => {
    await page.goto("/dev/");
    await page.locator(".user-profile").click();
    await page.getByRole("menuitem", { name: "Увійти" }).click();

    const loginDialog = page.getByRole("dialog");
    await expect(loginDialog.getByText("Вхід")).toBeVisible();

    // Login form label is «Емейл», not «Email» (registration uses Email).
    await loginDialog.getByRole("textbox", { name: "Емейл" }).fill(email);
    await loginDialog.getByRole("textbox", { name: "Пароль" }).fill(password);

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/signin")),
      loginDialog.getByRole("button", { name: "Увійти" }).click(),
    ]);

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.message).toMatch(/не підтвердили електронну пошту/i);
  });
});

test("REG-04 — Client-side field validation @regression @validation", async ({
  page,
}) => {
    await openRegistrationForm(page);
    await page.getByRole("textbox", { name: "Email" }).fill("bad");
    await expect(page.getByText("Некоректний формат email")).toBeVisible();
    await expect(
        page.getByRole("button", { name: "Зареєструватися" }),
      ).toBeDisabled();
    await page.getByRole("textbox", { name: "Телефон" }).fill("501234567");
    await expect(page.getByText('Телефон не відповідає вказаному формату')).toBeVisible();
    await expect(page.getByText('Телефон не відповідає українському формату (+380)')).toBeVisible();
    await expect(
        page.getByRole("button", { name: "Зареєструватися" }),
      ).toBeDisabled();
    await page.getByRole("textbox", { name: "Пароль" }).fill("short1!");
    await expect(page.getByText('Пароль не може бути коротшим, ніж 8 та довшим, ніж 20 символів')).toBeVisible();
    await expect(page.getByText('Пароль повинен містити хоча б одну велику літеру')).toBeVisible();

    await expect(
        page.getByRole("button", { name: "Зареєструватися" }),
      ).toBeDisabled();

});

test("REG-05 — Password confirmation mismatch @smoke @validation", async ({
  page,
}) => {
    await openRegistrationForm(page);
    await page.getByRole("textbox", { name: "Пароль" }).fill("Test123!");
    await page.getByRole("textbox", { name: "Підтвердження паролю" }).fill("Test1234!");
    await expect(page.getByText('Значення поля ‘Підтвердити пароль’ має бути еквівалентним значенню поля ‘Пароль’')).toBeVisible();
    await expect(
        page.getByRole("button", { name: "Зареєструватися" }),
      ).toBeDisabled();
});

test("REG-06 — Registration with Manager role @regression @role", async ({
  page,
}) => {
  const email = `test${Date.now()}@example.com`;

  await openRegistrationForm(page);

  await page.getByText("Керівник").click();
  await fillRegistrationForm(page, email);
  await page.getByRole("button", { name: "Зареєструватися" }).click();

  await expect(page.getByText(/зареєструвалися/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Реєстрація")).not.toBeVisible();
});

test("REG-07 — Duplicate email error @regression @api-error", async ({
  page,
}) => {
  await openRegistrationForm(page);
  const email = await fillRegistrationForm(page);
  await page.getByRole("button", { name: "Зареєструватися" }).click();
  await expect(page.getByText(/зареєструвалися/i)).toBeVisible({
    timeout: 15_000,
  });

  await openRegistrationForm(page);
  await fillRegistrationForm(page, email);
  await page.getByRole("button", { name: "Зареєструватися" }).click();
  await expect(
    page.getByText("Вказаний email вже зареєстрований на сайті"),
  ).toBeVisible();
});


test("REG-08 — OAuth registration links @regression @oauth", async ({
  page,
}) => {
  await openRegistrationForm(page);

  // Links are icon-only (img alt="Logo"); locate by oauth href instead of name.
  const googleLink = page.locator('a[href*="oauth2/authorize/google"]');
  const facebookLink = page.locator('a[href*="oauth2/authorize/facebook"]');

  await expect(googleLink).toHaveCount(1);
  await expect(facebookLink).toHaveCount(1);
  await expect(googleLink).toBeVisible();
  await expect(facebookLink).toBeVisible();

  await expect(googleLink).toHaveAttribute("href", /role=ROLE_USER/);
  await expect(facebookLink).toHaveAttribute("href", /role=ROLE_USER/);

  await page.getByText("Керівник").click();

  await expect(googleLink).toHaveAttribute("href", /role=ROLE_MANAGER/);
  await expect(facebookLink).toHaveAttribute("href", /role=ROLE_MANAGER/);
});