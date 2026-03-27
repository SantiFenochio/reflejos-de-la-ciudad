// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('carga correctamente y muestra el hero', async ({ page }) => {
    await page.goto('/');

    // Verificar título
    await expect(page).toHaveTitle(/Reflejos de la Ciudad/);

    // Verificar que el hero article existe y es visible
    const heroArticle = page.locator('article').first();
    await expect(heroArticle).toBeVisible();

    // Verificar que tiene imagen
    const heroImage = heroArticle.locator('img');
    await expect(heroImage).toBeVisible();

    // Verificar que tiene título
    const heroTitle = heroArticle.locator('h1');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).not.toBeEmpty();
  });

  test('muestra la navegación principal', async ({ page }) => {
    await page.goto('/');

    // Verificar que existe el nav
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Verificar que tiene links de secciones
    const deportesLink = page.getByRole('link', { name: /deportes/i });
    await expect(deportesLink).toBeVisible();
  });

  test('muestra las noticias en grid', async ({ page }) => {
    await page.goto('/');

    // Debe haber múltiples artículos
    const articles = page.locator('article');
    const count = await articles.count();
    expect(count).toBeGreaterThan(3);
  });

  test('el logo es clickeable y va a home', async ({ page }) => {
    await page.goto('/deportes');

    // Click en el logo
    await page.click('img[alt*="Logo"], img[alt*="Reflejos"]');

    // Debería estar en home
    await expect(page).toHaveURL('/');
  });
});

test.describe('Navegación', () => {
  test('click en sección deportes navega correctamente', async ({ page }) => {
    await page.goto('/');

    // Click en Deportes
    await page.click('text=Deportes');

    // Verificar URL
    await expect(page).toHaveURL(/.*deportes/);

    // Verificar que carga artículos de deportes
    await expect(page.locator('h1, h2')).toContainText(/deportes/i);
  });

  test('búsqueda funciona', async ({ page }) => {
    await page.goto('/');

    // Abrir búsqueda (si está en modal/overlay)
    const searchButton = page.locator('button[aria-label*="buscar"], button:has-text("Buscar")');
    if (await searchButton.isVisible()) {
      await searchButton.click();
    }

    // Escribir en el input de búsqueda
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]');
    await searchInput.fill('elecciones');

    // Esperar resultados (debounced)
    await page.waitForTimeout(500);

    // Debería mostrar resultados
    const results = page.locator('.search-results, [role="listbox"]');
    await expect(results).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('menu mobile se abre correctamente', async ({ page }) => {
    await page.goto('/');

    // Click en hamburger menu
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
    await menuButton.click();

    // Menu debe estar visible
    const mobileNav = page.locator('[role="dialog"], .mobile-menu');
    await expect(mobileNav).toBeVisible();
  });
});
