import { describe, it, expect } from 'vitest';
import { validateImportData } from '../src/logic.js';

// ═══════════════════════════════════════════════════════════════
// validateImportData — 导入文件格式校验
// ═══════════════════════════════════════════════════════════════

describe('validateImportData', () => {
  it('标准导出格式通过校验', () => {
    expect(validateImportData({
      countries: [
        { id: 'gt', name: '危地马拉', status: 'want', places: [] },
        { id: 'jp', name: '日本', status: 'visited', places: [] },
      ],
    })).toBe(true);
  });

  it('countries 为空数组时也通过（清空是合法操作）', () => {
    expect(validateImportData({ countries: [] })).toBe(true);
  });

  it('含有额外字段时也通过（向前兼容）', () => {
    expect(validateImportData({
      countries: [],
      version: 6,
      meta: { fund: 50000 },
    })).toBe(true);
  });

  it('缺少 countries 字段时校验失败', () => {
    expect(validateImportData({ destinations: [] })).toBe(false);
  });

  it('countries 是字符串时校验失败', () => {
    expect(validateImportData({ countries: '不是数组' })).toBe(false);
  });

  it('countries 是 null 时校验失败', () => {
    expect(validateImportData({ countries: null })).toBe(false);
  });

  it('countries 是对象（非数组）时校验失败', () => {
    expect(validateImportData({ countries: { 0: '危地马拉' } })).toBe(false);
  });

  it('传入 null 时校验失败（不抛错）', () => {
    expect(() => validateImportData(null)).not.toThrow();
    expect(validateImportData(null)).toBe(false);
  });

  it('传入 undefined 时校验失败（不抛错）', () => {
    expect(() => validateImportData(undefined)).not.toThrow();
    expect(validateImportData(undefined)).toBe(false);
  });

  it('传入字符串时校验失败', () => {
    expect(validateImportData('{"countries":[]}')).toBe(false);
  });

  it('传入数字时校验失败', () => {
    expect(validateImportData(42)).toBe(false);
  });

  it('传入数组时校验失败（顶层应为对象）', () => {
    expect(validateImportData([])).toBe(false);
  });
});
