import { describe, it, expect, beforeEach } from 'vitest';
import { reorderCircuit } from '../src/logic.js';

function 创建国家(id, 环线, 顺序) {
  return { id, name: `${id}（测试）`, circuit: 环线, circuitOrder: 顺序, tags: [], places: [] };
}

// ═══════════════════════════════════════════════════════════════
// reorderCircuit — 环线内顺序调整
// ═══════════════════════════════════════════════════════════════

describe('reorderCircuit', () => {
  let 中美洲国家列表;

  beforeEach(() => {
    // 危地马拉(1) → 伯利兹(2) → 洪都拉斯(3)
    中美洲国家列表 = [
      创建国家('危地马拉', '中美洲之旅', 1),
      创建国家('伯利兹', '中美洲之旅', 2),
      创建国家('洪都拉斯', '中美洲之旅', 3),
    ];
  });

  function 排序后id列表(countries, circuit) {
    return countries
      .filter(c => c.circuit === circuit)
      .sort((a, b) => a.circuitOrder - b.circuitOrder)
      .map(c => c.id);
  }

  // ── 正常移动 ──────────────────────────────────────────────────

  it('向下移动第一个元素', () => {
    reorderCircuit(中美洲国家列表, '危地马拉', 1);
    expect(排序后id列表(中美洲国家列表, '中美洲之旅')).toEqual([
      '伯利兹', '危地马拉', '洪都拉斯',
    ]);
  });

  it('向上移动最后一个元素', () => {
    reorderCircuit(中美洲国家列表, '洪都拉斯', -1);
    expect(排序后id列表(中美洲国家列表, '中美洲之旅')).toEqual([
      '危地马拉', '洪都拉斯', '伯利兹',
    ]);
  });

  it('向下移动中间元素', () => {
    reorderCircuit(中美洲国家列表, '伯利兹', 1);
    expect(排序后id列表(中美洲国家列表, '中美洲之旅')).toEqual([
      '危地马拉', '洪都拉斯', '伯利兹',
    ]);
  });

  it('向上移动中间元素', () => {
    reorderCircuit(中美洲国家列表, '伯利兹', -1);
    expect(排序后id列表(中美洲国家列表, '中美洲之旅')).toEqual([
      '伯利兹', '危地马拉', '洪都拉斯',
    ]);
  });

  // ── 边界：无操作 ──────────────────────────────────────────────

  it('第一个元素向上移动不做任何改动', () => {
    const 移动前 = 中美洲国家列表.map(c => ({ id: c.id, order: c.circuitOrder }));
    reorderCircuit(中美洲国家列表, '危地马拉', -1);
    const 移动后 = 中美洲国家列表.map(c => ({ id: c.id, order: c.circuitOrder }));
    expect(移动后).toEqual(移动前);
  });

  it('最后一个元素向下移动不做任何改动', () => {
    const 移动前 = 中美洲国家列表.map(c => ({ id: c.id, order: c.circuitOrder }));
    reorderCircuit(中美洲国家列表, '洪都拉斯', 1);
    const 移动后 = 中美洲国家列表.map(c => ({ id: c.id, order: c.circuitOrder }));
    expect(移动后).toEqual(移动前);
  });

  it('只有一个成员的环线，上下移动均无效', () => {
    const 单国 = [创建国家('墨西哥', '墨西哥单线', 1)];
    const 移动前 = 单国.map(c => ({ id: c.id, order: c.circuitOrder }));
    reorderCircuit(单国, '墨西哥', 1);
    reorderCircuit(单国, '墨西哥', -1);
    const 移动后 = 单国.map(c => ({ id: c.id, order: c.circuitOrder }));
    expect(移动后).toEqual(移动前);
  });

  // ── 安全处理 ─────────────────────────────────────────────────

  it('不存在的 id，安全返回不抛错', () => {
    expect(() => reorderCircuit(中美洲国家列表, '不存在的国家', 1)).not.toThrow();
  });

  it('没有加入环线的国家（circuit=null）不做任何改动', () => {
    const 无环线 = 创建国家('日本', null, null);
    中美洲国家列表.push(无环线);
    const 移动前顺序 = 中美洲国家列表.find(c => c.id === '危地马拉').circuitOrder;
    reorderCircuit(中美洲国家列表, '日本', 1);
    expect(中美洲国家列表.find(c => c.id === '危地马拉').circuitOrder).toBe(移动前顺序);
  });

  // ── 多环线隔离 ────────────────────────────────────────────────

  it('移动一条环线中的国家，不影响另一条环线', () => {
    const 东南亚 = [
      创建国家('泰国', '东南亚之旅', 1),
      创建国家('越南', '东南亚之旅', 2),
    ];
    const all = [...中美洲国家列表, ...东南亚];

    reorderCircuit(all, '危地马拉', 1); // 只移动中美洲

    // 东南亚顺序应保持不变
    expect(排序后id列表(all, '东南亚之旅')).toEqual(['泰国', '越南']);
  });
});
