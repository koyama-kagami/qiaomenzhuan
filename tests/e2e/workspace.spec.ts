import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Workspace } from '@nextoffer/core';
import { startServer } from '../../apps/cli/src/server';
let directory: string;
let running: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'qiaomenzhuan-browser-'));
  running = await startServer({ workspace: directory, port: 0 });
});
test.afterAll(async () => {
  await running?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

test('stack home, click slide, blank job page and persistent resume drafts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(running.url);
  await expect(page.locator('.sidebar')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('.resume-stack')).toBeVisible();
  await page.getByRole('button', { name: '去求职', exact: true }).hover();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-page="resumes"]')).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('button', { name: '去求职', exact: true }).click();
  await expect(page.locator('[data-page="search"]')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('[data-page="search"]')).toHaveText('');
  await page.getByRole('button', { name: '菜就多练', exact: true }).click();
  await page.getByRole('button', { name: '新建简历', exact: true }).click();
  await page.getByLabel('简历名称').fill('后端简历');
  await page.getByRole('button', { name: '创建简历', exact: true }).click();
  const source = await page.getByLabel('LaTeX 源码', { exact: true }).inputValue();
  await page.getByLabel('LaTeX 源码', { exact: true }).fill(source.replace('你的姓名', '测试同学'));
  await page.getByRole('button', { name: '去求职', exact: true }).click();
  await expect(page.locator('[data-page="search"]')).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('button', { name: '菜就多练', exact: true }).click();
  await expect(page.getByLabel('LaTeX 源码', { exact: true })).toHaveValue(
    source.replace('你的姓名', '测试同学'),
  );
  await page.getByRole('button', { name: '保存版本', exact: true }).click();
  await expect(page.getByText('已保存 v2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '返回简历', exact: true }).click();
  await expect(page.getByRole('button', { name: '打开简历：后端简历', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '打开简历：后端简历', exact: true }).click();
  await expect(page.getByLabel('LaTeX 源码', { exact: true })).toHaveValue(
    source.replace('你的姓名', '测试同学'),
  );
  expect((await new Workspace(directory).list('resumes'))[0].version).toBe(2);
  expect(errors).toEqual([]);
});

test('mobile and reduced motion support click and keyboard page switching', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(running.url);
  await page.getByRole('button', { name: '去求职', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-page="search"]')).toHaveAttribute('aria-hidden', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '菜就多练', exact: true }).click();
  await expect(page.locator('.resume-stack')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('toolbar exports only the selected resume PDF and removes workspace actions', async ({
  page,
}) => {
  const workspace = new Workspace(directory);
  const first = await workspace.save('resumes', { title: '导出测试 A', source: 'A' });
  const second = await workspace.save('resumes', { title: '导出测试 B', source: 'B' });
  const compiled: string[] = [];
  await page.route('**/api/resumes/*/build', async (route) => {
    const id = new URL(route.request().url()).pathname.split('/')[3];
    compiled.push(id);
    await route.fulfill({ json: { ok: true, data: { url: `/api/resumes/${id}/pdf` } } });
  });
  await page.route('**/api/resumes/*/pdf', (route) =>
    route.fulfill({ contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' }),
  );
  await page.goto(running.url);
  await expect(page.getByRole('button', { name: '刷新工作区' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '导出工作区' })).toHaveCount(0);
  await page.getByRole('button', { name: '导出简历', exact: true }).click();
  await page.getByLabel('选择简历').selectOption(second.id);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 PDF' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('导出测试 B.pdf');
  expect(compiled).toEqual([second.id]);
  await page
    .locator('.resume-index')
    .getByRole('button', { name: '导出测试 A', exact: true })
    .click();
  const nextDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出简历', exact: true }).click();
  expect((await nextDownload).suggestedFilename()).toBe('导出测试 A.pdf');
  expect(compiled).toEqual([second.id, first.id]);
  await page.getByLabel('LaTeX 源码', { exact: true }).fill('changed');
  await page.getByRole('button', { name: '导出简历', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('请先保存');
  expect(compiled).toHaveLength(2);
});
