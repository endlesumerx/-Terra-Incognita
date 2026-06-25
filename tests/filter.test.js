import { describe, it, expect } from 'vitest';
import { matchesFilter } from '../src/logic.js';

// ── 测试数据 ───────────────────────────────────────────────────────────────

const 危地马拉 = {
  id: 'gt',
  name: '危地马拉',
  continent: '北美洲',
  circuit: '中美洲之旅',
  status: 'want',
  tags: ['古迹遗址', '人文历史'],
  places: [
    {
      id: 'tikal',
      name: '提卡尔 Tikal',
      bestMonths: [11, 12, 1, 2, 3],
      tags: ['古迹遗址', '丛林'],
    },
    {
      id: 'antigua',
      name: '安提瓜 Antigua',
      bestMonths: [3, 4, 5],
      tags: ['人文历史', '殖民建筑'],
    },
  ],
};

const 日本 = {
  id: 'jp',
  name: '日本',
  continent: '亚洲',
  circuit: null,
  status: 'visited',
  tags: ['美食', '现代都市'],
  places: [
    {
      id: 'kyoto',
      name: '京都',
      bestMonths: [3, 4, 10, 11],
      tags: ['人文历史', '赏樱'],
    },
    {
      id: 'tokyo',
      name: '东京',
      bestMonths: [3, 4, 9, 10, 11],
      tags: ['现代都市', '美食'],
    },
  ],
};

const 无景点国家 = {
  id: 'aq',
  name: '南极洲',
  continent: '南极洲',
  circuit: null,
  status: 'none',
  tags: [],
  places: [],
};

// ═══════════════════════════════════════════════════════════════
// 状态筛选
// ═══════════════════════════════════════════════════════════════

describe('matchesFilter — 状态筛选', () => {
  it('status=all 时全部通过', () => {
    expect(matchesFilter(危地马拉, { status: 'all' })).toBe(true);
    expect(matchesFilter(日本, { status: 'all' })).toBe(true);
    expect(matchesFilter(无景点国家, { status: 'all' })).toBe(true);
  });

  it('status=want 只匹配想去的目的地', () => {
    expect(matchesFilter(危地马拉, { status: 'want' })).toBe(true);
    expect(matchesFilter(日本, { status: 'want' })).toBe(false);
  });

  it('status=visited 只匹配已打卡的目的地', () => {
    expect(matchesFilter(日本, { status: 'visited' })).toBe(true);
    expect(matchesFilter(危地马拉, { status: 'visited' })).toBe(false);
  });

  it('status=none 只匹配未分类目的地', () => {
    expect(matchesFilter(无景点国家, { status: 'none' })).toBe(true);
    expect(matchesFilter(危地马拉, { status: 'none' })).toBe(false);
  });

  it('不传 status 时默认为 all，全部通过', () => {
    expect(matchesFilter(危地马拉, {})).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 环线筛选
// ═══════════════════════════════════════════════════════════════

describe('matchesFilter — 环线筛选', () => {
  it('匹配所属环线', () => {
    expect(matchesFilter(危地马拉, { circuit: '中美洲之旅' })).toBe(true);
  });

  it('不在该环线中的国家被过滤掉', () => {
    expect(matchesFilter(日本, { circuit: '中美洲之旅' })).toBe(false);
  });

  it('circuit=null 时不限制环线', () => {
    expect(matchesFilter(危地马拉, { circuit: null })).toBe(true);
    expect(matchesFilter(日本, { circuit: null })).toBe(true);
  });

  it('没有加入任何环线的国家，筛选特定环线时被排除', () => {
    expect(matchesFilter(日本, { circuit: '中美洲之旅' })).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// 标签筛选（AND 逻辑）
// ═══════════════════════════════════════════════════════════════

describe('matchesFilter — 标签筛选', () => {
  it('国家自身标签命中时通过', () => {
    expect(matchesFilter(危地马拉, { tags: ['人文历史'] })).toBe(true);
  });

  it('景点标签也参与匹配（国家本身没有此标签）', () => {
    expect(matchesFilter(危地马拉, { tags: ['丛林'] })).toBe(true);
  });

  it('多个标签全部命中才通过（AND 逻辑）', () => {
    expect(matchesFilter(危地马拉, { tags: ['古迹遗址', '丛林'] })).toBe(true);
  });

  it('有一个标签不命中则被过滤', () => {
    expect(matchesFilter(危地马拉, { tags: ['古迹遗址', '赏樱'] })).toBe(false);
  });

  it('tags 为空数组时不过滤', () => {
    expect(matchesFilter(危地马拉, { tags: [] })).toBe(true);
    expect(matchesFilter(无景点国家, { tags: [] })).toBe(true);
  });

  it('无景点的国家，景点标签为空，单标签筛选失败', () => {
    expect(matchesFilter(无景点国家, { tags: ['丛林'] })).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// 月份筛选
// ═══════════════════════════════════════════════════════════════

describe('matchesFilter — 月份筛选', () => {
  it('景点最佳月份包含所选月份时通过', () => {
    expect(matchesFilter(危地马拉, { months: [11] })).toBe(true);
    expect(matchesFilter(危地马拉, { months: [3] })).toBe(true); // 两个景点均含 3 月
  });

  it('所选月份不在任何景点的最佳月份中时被过滤', () => {
    expect(matchesFilter(危地马拉, { months: [7] })).toBe(false);
  });

  it('months 为空数组时不过滤', () => {
    expect(matchesFilter(危地马拉, { months: [] })).toBe(true);
    expect(matchesFilter(无景点国家, { months: [] })).toBe(true);
  });

  it('没有景点的国家，月份筛选直接失败', () => {
    expect(matchesFilter(无景点国家, { months: [6] })).toBe(false);
  });

  it('多月份选中，任一命中即通过', () => {
    expect(matchesFilter(日本, { months: [3, 7] })).toBe(true);  // 3 月命中京都/东京
  });
});

// ═══════════════════════════════════════════════════════════════
// 全文搜索
// ═══════════════════════════════════════════════════════════════

describe('matchesFilter — 全文搜索', () => {
  it('按国家名搜索', () => {
    expect(matchesFilter(危地马拉, { searchQuery: '危地' })).toBe(true);
    expect(matchesFilter(日本, { searchQuery: '危地' })).toBe(false);
  });

  it('按景点名搜索', () => {
    expect(matchesFilter(危地马拉, { searchQuery: '安提瓜' })).toBe(true);
  });

  it('按景点英文名搜索（Tikal）', () => {
    expect(matchesFilter(危地马拉, { searchQuery: 'tikal' })).toBe(true);
  });

  it('大小写不敏感', () => {
    expect(matchesFilter(危地马拉, { searchQuery: 'TIKAL' })).toBe(true);
    expect(matchesFilter(危地马拉, { searchQuery: 'TiKaL' })).toBe(true);
  });

  it('按大洲名搜索', () => {
    expect(matchesFilter(日本, { searchQuery: '亚洲' })).toBe(true);
  });

  it('按环线名搜索', () => {
    expect(matchesFilter(危地马拉, { searchQuery: '中美洲之旅' })).toBe(true);
    expect(matchesFilter(日本, { searchQuery: '中美洲之旅' })).toBe(false);
  });

  it('按景点标签搜索', () => {
    expect(matchesFilter(危地马拉, { searchQuery: '丛林' })).toBe(true);
  });

  it('searchQuery 为空字符串时不过滤', () => {
    expect(matchesFilter(危地马拉, { searchQuery: '' })).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 多条件组合
// ═══════════════════════════════════════════════════════════════

describe('matchesFilter — 多条件组合', () => {
  it('状态 + 标签 同时命中', () => {
    expect(matchesFilter(危地马拉, { status: 'want', tags: ['古迹遗址'] })).toBe(true);
  });

  it('状态 + 标签，状态不匹配则被过滤', () => {
    expect(matchesFilter(日本, { status: 'want', tags: ['人文历史'] })).toBe(false);
  });

  it('状态 + 月份 + 关键词全部命中', () => {
    expect(matchesFilter(危地马拉, {
      status: 'want',
      months: [12],
      searchQuery: '危地',
    })).toBe(true);
  });

  it('月份不命中时整体失败', () => {
    expect(matchesFilter(危地马拉, {
      status: 'want',
      months: [7],  // 危地马拉 7 月不是最佳时间
      searchQuery: '危地',
    })).toBe(false);
  });

  it('六个条件全部通过', () => {
    expect(matchesFilter(危地马拉, {
      status: 'want',
      circuit: '中美洲之旅',
      tags: ['丛林'],
      months: [11],
      searchQuery: 'tikal',
    })).toBe(true);
  });
});
