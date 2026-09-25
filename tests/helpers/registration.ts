import { expect, Page } from "@playwright/test";

export async function openRegistrationForm(page: Page): Promise<void> {
  await page.goto("/dev/");
  await page.locator(".user-profile").click();
  await page.getByText("Зареєструватися").first().click();
  await expect(page.getByText("Реєстрація")).toBeVisible();
}

/** Fills the open registration form. Returns the email used (for reuse in REG-07). */
export async function fillRegistrationForm(
  page: Page,
  email = `test${Date.now()}@example.com`,
): Promise<string> {
  await page.getByRole("textbox", { name: "Прізвище" }).fill("Шевченко");
  await page.getByRole("textbox", { name: "Ім`я" }).fill("Тарас");
  await page.getByRole("textbox", { name: "Телефон" }).fill("0501234567");
  // API rejects emails with '+'; use a unique address without it.
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Пароль" }).fill("Test123!");
  await page
    .getByRole("textbox", { name: "Підтвердження паролю" })
    .fill("Test123!");
  return email;
}