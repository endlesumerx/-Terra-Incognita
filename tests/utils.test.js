import { describe, it, expect } from 'vitest';
import { escapeHtml, highlight } from '../src/logic.js';

// ═══════════════════════════════════════════════════════════════
// escapeHtml — HTML 转义
// ═══════════════════════════════════════════════════════════════

describe('escapeHtml', () => {
  it('普通中文文字原样返回', () => {
    expect(escapeHtml('危地马拉')).toBe('危地马拉');
  });

  it('转义 < 和 >', () => {
    expect(escapeHtml('<script>危险</script>')).toBe('&lt;script&gt;危险&lt;/script&gt;');
  });

  it('转义 &', () => {
    expect(escapeHtml('Tom & Jerry & 美食')).toBe('Tom &amp; Jerry &amp; 美食');
  });

  it('转义双引号', () => {
    expect(escapeHtml('"京都"')).toBe('&quot;京都&quot;');
  });

  it('null 返回空字符串', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('undefined 返回空字符串', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('空字符串返回空字符串', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('混合特殊字符全部转义', () => {
    expect(escapeHtml('<危地马拉 name="gt">')).toBe('&lt;危地马拉 name=&quot;gt&quot;&gt;');
  });
});

// ═══════════════════════════════════════════════════════════════
// highlight — 搜索词高亮
// ═══════════════════════════════════════════════════════════════

describe('highlight', () => {
  it('关键词用 <mark> 包裹', () => {
    expect(highlight('危地马拉', '危地')).toBe('<mark>危地</mark>马拉');
  });

  it('搜索词为空字符串时返回转义原文', () => {
    expect(highlight('危地马拉', '')).toBe('危地马拉');
  });

  it('searchQuery 为 null 时返回转义原文', () => {
    expect(highlight('危地马拉', null)).toBe('危地马拉');
  });

  it('text 为空字符串时不报错，返回空字符串', () => {
    expect(highlight('', '关键词')).toBe('');
  });

  it('text 为 null 时不报错', () => {
    expect(highlight(null, '关键词')).toBe('');
  });

  it('大小写不敏感（英文景点名）', () => {
    expect(highlight('提卡尔 Tikal', 'tikal')).toBe('提卡尔 <mark>Tikal</mark>');
  });

  it('同一文字中多次命中均高亮', () => {
    const result = highlight('京都 京都塔', '京都');
    expect(result).toBe('<mark>京都</mark> <mark>京都</mark>塔');
  });

  it('搜索词含正则特殊字符（c++）不抛错', () => {
    expect(() => highlight('c++ 语言旅行', 'c++')).not.toThrow();
    expect(highlight('c++ 语言旅行', 'c++')).toContain('<mark>c++</mark>');
  });

  it('搜索词含点号（.）不误匹配任意字符', () => {
    expect(highlight('abc', 'a.c')).toBe('abc');
  });

  it('返回 HTML 中原有的 < > 仍是转义形式', () => {
    const result = highlight('<危地马拉>', '危地');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('<mark>危地</mark>');
  });
});
