import { describe, it, expect } from 'vitest';
import { normalizeCheckins, normalizeRegionName } from '../src/logic.js';

const 七大洲 = ['亚洲', '欧洲', '北美洲', '南美洲', '非洲', '大洋洲', '南极洲'];

const 区域归一化表 = {
  '东亚': '亚洲',
  '东南亚': '亚洲',
  '中亚': '亚洲',
  '南亚': '亚洲',
  '中东': '亚洲',
  '中美洲': '北美洲',
  '加勒比': '北美洲',
  '北欧': '欧洲',
  '西欧': '欧洲',
  '东欧': '欧洲',
  '南欧': '欧洲',
  '东非': '非洲',
  '西非': '非洲',
  '南非': '非洲',
};

// ═══════════════════════════════════════════════════════════════
// normalizeCheckins — 补全打卡字段
// ═══════════════════════════════════════════════════════════════

describe('normalizeCheckins', () => {
  it('有 visitedDate 的景点，visited 应为 true', () => {
    const 输入 = [{ id: 'jp', places: [{ id: 'kyoto', visitedDate: '2024-03' }] }];
    const 结果 = normalizeCheckins(输入);
    expect(结果[0].places[0].visited).toBe(true);
  });

  it('visited 字段缺失时默认设为 false', () => {
    const 输入 = [{ id: 'gt', places: [{ id: 'tikal', name: '提卡尔 Tikal' }] }];
    const 结果 = normalizeCheckins(输入);
    expect(结果[0].places[0].visited).toBe(false);
  });

  it('明确设为 false 的 visited 保持不变', () => {
    const 输入 = [{ id: 'gt', places: [{ id: 'tikal', visited: false }] }];
    const 结果 = normalizeCheckins(输入);
    expect(结果[0].places[0].visited).toBe(false);
  });

  it('明确设为 true 的 visited 保持不变（无 visitedDate）', () => {
    const 输入 = [{ id: 'gt', places: [{ id: 'tikal', visited: true }] }];
    const 结果 = normalizeCheckins(输入);
    expect(结果[0].places[0].visited).toBe(true);
  });

  it('同一国家下混合多种情况', () => {
    const 输入 = [{
      id: 'jp',
      places: [
        { id: 'kyoto', visitedDate: '2024-03' },     // 有日期 → true
        { id: 'tokyo', visited: false },              // 明确 false → false
        { id: 'osaka' },                              // 缺失 → false
      ],
    }];
    const 结果 = normalizeCheckins(输入);
    expect(结果[0].places[0].visited).toBe(true);
    expect(结果[0].places[1].visited).toBe(false);
    expect(结果[0].places[2].visited).toBe(false);
  });

  it('没有景点的国家不报错', () => {
    const 输入 = [{ id: 'aq', places: [] }];
    expect(() => normalizeCheckins(输入)).not.toThrow();
    expect(normalizeCheckins(输入)[0].places).toEqual([]);
  });

  it('places 字段缺失的国家不报错', () => {
    const 输入 = [{ id: 'aq' }];
    expect(() => normalizeCheckins(输入)).not.toThrow();
  });

  it('不修改原始数据（不可变操作）', () => {
    const 原始 = [{ id: 'jp', places: [{ id: 'kyoto' }] }];
    normalizeCheckins(原始);
    expect(原始[0].places[0].visited).toBeUndefined();
  });

  it('处理多个国家', () => {
    const 输入 = [
      { id: 'jp', places: [{ id: 'kyoto', visitedDate: '2024-03' }] },
      { id: 'gt', places: [{ id: 'tikal' }] },
    ];
    const 结果 = normalizeCheckins(输入);
    expect(结果[0].places[0].visited).toBe(true);
    expect(结果[1].places[0].visited).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// normalizeRegionName — 大洲名称归一化
// ═══════════════════════════════════════════════════════════════

describe('normalizeRegionName', () => {
  it('七大洲标准名称原样返回', () => {
    for (const 洲 of 七大洲) {
      expect(normalizeRegionName(洲, 七大洲, 区域归一化表)).toBe(洲);
    }
  });

  it('东南亚 → 亚洲', () => {
    expect(normalizeRegionName('东南亚', 七大洲, 区域归一化表)).toBe('亚洲');
  });

  it('中美洲 → 北美洲', () => {
    expect(normalizeRegionName('中美洲', 七大洲, 区域归一化表)).toBe('北美洲');
  });

  it('西欧 → 欧洲', () => {
    expect(normalizeRegionName('西欧', 七大洲, 区域归一化表)).toBe('欧洲');
  });

  it('东非 → 非洲', () => {
    expect(normalizeRegionName('东非', 七大洲, 区域归一化表)).toBe('非洲');
  });

  it('中东 → 亚洲', () => {
    expect(normalizeRegionName('中东', 七大洲, 区域归一化表)).toBe('亚洲');
  });

  it('完全未知的区域名称回退到「亚洲」', () => {
    expect(normalizeRegionName('火星', 七大洲, 区域归一化表)).toBe('亚洲');
  });

  it('空字符串回退到「亚洲」', () => {
    expect(normalizeRegionName('', 七大洲, 区域归一化表)).toBe('亚洲');
  });

  it('undefined 回退到「亚洲」（不抛错）', () => {
    expect(() => normalizeRegionName(undefined, 七大洲, 区域归一化表)).not.toThrow();
    expect(normalizeRegionName(undefined, 七大洲, 区域归一化表)).toBe('亚洲');
  });
});
