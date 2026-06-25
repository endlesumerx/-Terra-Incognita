/**
 * 纯逻辑函数 — 不依赖 DOM、localStorage 或全局状态。
 * 从 index.html 提取，以便独立测试。
 */

// ── HTML 工具 ──────────────────────────────────────────────────────────────

/** HTML 实体转义，防止 XSS */
export function escapeHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 在 HTML 字符串中高亮搜索词（返回含 <mark> 标签的字符串）。
 * 搜索词中的正则特殊字符会被自动转义。
 */
export function highlight(text, searchQuery) {
  if (!searchQuery || !text) return escapeHtml(text);
  const re = new RegExp(
    '(' + searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')',
    'gi',
  );
  return escapeHtml(text).replace(re, '<mark>$1</mark>');
}

// ── 筛选 ───────────────────────────────────────────────────────────────────

/**
 * 判断一个国家/地区对象是否通过当前筛选条件。
 *
 * @param {object} country   - 国家数据对象
 * @param {object} filters   - 当前筛选条件
 *   status:      'all' | 'want' | 'visited' | 'none'
 *   circuit:     环线名称，null = 不限
 *   tags:        标签数组（AND 逻辑，国家标签 + 景点标签合并匹配）
 *   months:      月份数组（1-12，任一景点命中即通过）
 *   searchQuery: 全文搜索词
 */
export function matchesFilter(country, filters = {}) {
  const {
    status = 'all',
    circuit = null,
    tags = [],
    months = [],
    searchQuery = '',
  } = filters;

  if (status !== 'all' && country.status !== status) return false;
  if (circuit && country.circuit !== circuit) return false;

  if (tags.length) {
    const ctags = country.tags || [];
    const ptags = (country.places || []).flatMap(p => p.tags || []);
    if (!tags.every(t => ctags.includes(t) || ptags.includes(t))) return false;
  }

  if (months.length) {
    const hit = (country.places || []).some(p =>
      (p.bestMonths || []).some(m => months.includes(m)),
    );
    if (!hit) return false;
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const fields = [
      country.name,
      country.circuit || '',
      country.continent || '',
      ...(country.tags || []),
      ...(country.places || []).flatMap(p => [p.name, ...(p.tags || [])]),
    ];
    if (!fields.some(s => (s || '').toLowerCase().includes(q))) return false;
  }

  return true;
}

// ── 环线排序 ───────────────────────────────────────────────────────────────

/**
 * 调整环线内某个国家的顺序（上移 dir=-1，下移 dir=1）。
 * 直接修改 countries 数组内对象的 circuitOrder 字段，并返回原数组。
 * 边界检测：已是第一位时无法上移，已是最后一位时无法下移。
 */
export function reorderCircuit(countries, id, dir) {
  const target = countries.find(x => x.id === id);
  if (!target || !target.circuit) return countries;

  const members = countries
    .filter(x => x.circuit === target.circuit)
    .sort((a, b) => (a.circuitOrder || 99) - (b.circuitOrder || 99));

  const idx = members.indexOf(target);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= members.length) return countries;

  const tmp = members[newIdx].circuitOrder || newIdx + 1;
  members[newIdx].circuitOrder = members[idx].circuitOrder || idx + 1;
  members[idx].circuitOrder = tmp;

  return countries;
}

// ── 状态管理 ───────────────────────────────────────────────────────────────

/**
 * 变更国家状态，首次设为 visited 时自动填写当月为打卡日期。
 * 返回新对象，不修改原始数据。
 */
export function applyStatusChange(country, newStatus, now = new Date()) {
  const updated = { ...country, status: newStatus };
  if (newStatus === 'visited' && !updated.visitedDate) {
    updated.visitedDate =
      now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }
  return updated;
}

// ── 数据规范化 ────────────────────────────────────────────────────────────

/**
 * 补全 places 中缺失的 visited 字段：
 *   - 有 visitedDate 的 → visited = true
 *   - visited 字段不存在 → visited = false
 *   - 已有明确值 → 保持不变
 * 返回新数组，不修改原始数据。
 */
export function normalizeCheckins(countries) {
  return countries.map(c => ({
    ...c,
    places: (c.places || []).map(p => ({
      ...p,
      visited: p.visitedDate
        ? true
        : typeof p.visited === 'undefined'
        ? false
        : p.visited,
    })),
  }));
}

/**
 * 将旧版子区域名称归一化为七大洲标准名称。
 *
 * @param {string}   continent   - 原始大洲/区域名称
 * @param {string[]} bigRegions  - 合法的七大洲名称列表
 * @param {object}   regionMap   - 旧名称 → 新名称 映射表
 * @returns {string} 归一化后的大洲名称，未知区域回退到「亚洲」
 */
export function normalizeRegionName(continent, bigRegions, regionMap) {
  if (bigRegions.includes(continent)) return continent;
  return regionMap[continent] || '亚洲';
}

// ── 排序 ──────────────────────────────────────────────────────────────────

/** 按日期字段升序比较（空值排最后） */
export function compareDateAsc(a, b, key) {
  return (a[key] || '9999-99').localeCompare(b[key] || '9999-99');
}

/** 按日期字段降序比较（空值排最后） */
export function compareDateDesc(a, b, key) {
  return (b[key] || '0000-00').localeCompare(a[key] || '0000-00');
}

// ── 导入校验 ──────────────────────────────────────────────────────────────

/** 校验导入数据是否为合法的 Travel Atlas 格式 */
export function validateImportData(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (!Array.isArray(parsed.countries)) return false;
  return true;
}
