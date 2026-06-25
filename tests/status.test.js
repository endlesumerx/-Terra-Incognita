import { describe, it, expect } from 'vitest';
import { applyStatusChange, compareDateAsc, compareDateDesc } from '../src/logic.js';

// ═══════════════════════════════════════════════════════════════
// applyStatusChange — 状态变更
// ═══════════════════════════════════════════════════════════════

describe('applyStatusChange', () => {
  const 危地马拉 = {
    id: 'gt',
    name: '危地马拉',
    status: 'want',
    visitedDate: null,
  };

  it('设为 visited 时自动填写当月日期', () => {
    const result = applyStatusChange(危地马拉, 'visited', new Date('2025-03-15'));
    expect(result.status).toBe('visited');
    expect(result.visitedDate).toBe('2025-03');
  });

  it('月份为单位数时补零（1 月 → 01）', () => {
    const result = applyStatusChange(危地马拉, 'visited', new Date('2025-01-05'));
    expect(result.visitedDate).toBe('2025-01');
  });

  it('已有 visitedDate 时设为 visited 不覆盖原有日期', () => {
    const 已打卡 = { ...危地马拉, status: 'visited', visitedDate: '2023-07' };
    const result = applyStatusChange(已打卡, 'visited', new Date('2025-03-15'));
    expect(result.visitedDate).toBe('2023-07');
  });

  it('从 visited 改为 want 不自动清除 visitedDate（保留历史记录）', () => {
    const 已打卡 = { ...危地马拉, status: 'visited', visitedDate: '2023-07' };
    const result = applyStatusChange(已打卡, 'want');
    expect(result.status).toBe('want');
    expect(result.visitedDate).toBe('2023-07');
  });

  it('设为 none 时不自动填写日期', () => {
    const result = applyStatusChange(危地马拉, 'none', new Date('2025-03-15'));
    expect(result.status).toBe('none');
    expect(result.visitedDate).toBeNull();
  });

  it('不修改原始对象（不可变操作）', () => {
    applyStatusChange(危地马拉, 'visited', new Date());
    expect(危地马拉.status).toBe('want');
    expect(危地马拉.visitedDate).toBeNull();
  });

  it('返回的对象包含所有原始字段', () => {
    const 含额外字段 = { ...危地马拉, places: [], tags: ['古迹遗址'] };
    const result = applyStatusChange(含额外字段, 'want');
    expect(result.places).toEqual([]);
    expect(result.tags).toEqual(['古迹遗址']);
  });
});

// ═══════════════════════════════════════════════════════════════
// compareDateAsc — 日期升序排序（计划出行时间）
// ═══════════════════════════════════════════════════════════════

describe('compareDateAsc（升序，早的在前）', () => {
  const 二月出发 = { id: 'a', plannedDate: '2025-02', name: '日本' };
  const 八月出发 = { id: 'b', plannedDate: '2025-08', name: '秘鲁' };
  const 无计划日期 = { id: 'c', name: '南极洲' };

  it('较早日期排在较晚日期前面', () => {
    expect(compareDateAsc(二月出发, 八月出发, 'plannedDate')).toBeLessThan(0);
  });

  it('较晚日期排在较早日期后面', () => {
    expect(compareDateAsc(八月出发, 二月出发, 'plannedDate')).toBeGreaterThan(0);
  });

  it('相同日期比较结果为 0', () => {
    expect(compareDateAsc(二月出发, { ...二月出发, id: 'd' }, 'plannedDate')).toBe(0);
  });

  it('无日期的条目排在最后', () => {
    expect(compareDateAsc(无计划日期, 二月出发, 'plannedDate')).toBeGreaterThan(0);
    expect(compareDateAsc(无计划日期, 八月出发, 'plannedDate')).toBeGreaterThan(0);
  });

  it('可以对数组排序（三条记录）', () => {
    const 列表 = [八月出发, 无计划日期, 二月出发].slice();
    列表.sort((a, b) => compareDateAsc(a, b, 'plannedDate'));
    expect(列表.map(c => c.id)).toEqual(['a', 'b', 'c']);
  });
});

// ═══════════════════════════════════════════════════════════════
// compareDateDesc — 日期降序排序（打卡记录，最近打卡在前）
// ═══════════════════════════════════════════════════════════════

describe('compareDateDesc（降序，近的在前）', () => {
  const 二三年打卡 = { id: 'a', visitedDate: '2023-07', name: '日本' };
  const 二五年打卡 = { id: 'b', visitedDate: '2025-02', name: '秘鲁' };
  const 未打卡 = { id: 'c', name: '危地马拉' };

  it('较近日期排在较远日期前面', () => {
    expect(compareDateDesc(二五年打卡, 二三年打卡, 'visitedDate')).toBeLessThan(0);
  });

  it('较远日期排在较近日期后面', () => {
    expect(compareDateDesc(二三年打卡, 二五年打卡, 'visitedDate')).toBeGreaterThan(0);
  });

  it('无日期的条目排在最后', () => {
    expect(compareDateDesc(未打卡, 二三年打卡, 'visitedDate')).toBeGreaterThan(0);
  });

  it('可以对打卡记录时间线排序', () => {
    const 列表 = [未打卡, 二三年打卡, 二五年打卡].slice();
    列表.sort((a, b) => compareDateDesc(a, b, 'visitedDate'));
    expect(列表.map(c => c.id)).toEqual(['b', 'a', 'c']);
  });
});
