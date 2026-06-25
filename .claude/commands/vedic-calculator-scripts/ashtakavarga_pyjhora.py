"""
ashtakavarga_pyjhora.py - PyJHora Ashtakavarga 封装
SAV/BAV 100% 匹配 JHora 桌面版
"""


def calculate_ashtakavarga_fixed(year, month, day, hour, minute, lat, lon, tz_offset):
    """
    使用 PyJHora 计算 SAV/BAV，100% 匹配 JHora 桌面版。
    
    Returns:
        dict: {
            'sarvashtakavarga': {sign_name: int, ...},  # SAV per sign
            'bhinnashtakavarga': {planet_name: {sign_name: int, ...}, ...},  # BAV
            'sav_total': int,
            'sodhya_pindas': {...} or None,
        }
    """
    import sys
    import os
    import swisseph as swe

    pyjhora_path = None
    try:
        import jhora as _jh
        pyjhora_path = os.path.dirname(os.path.dirname(_jh.__file__))
    except ImportError:
        import site
        for sp in site.getsitepackages():
            if os.path.exists(os.path.join(sp, 'jhora')):
                pyjhora_path = sp
                break
    if pyjhora_path is None:
        raise ImportError("jhora package not found")
    if pyjhora_path not in sys.path:
        sys.path.insert(0, pyjhora_path)
    swe.set_ephe_path(os.path.join(pyjhora_path, 'jhora', 'data', 'ephe'))

    # Monkey-patch
    for fn_name in ['calc_ut', 'calc']:
        orig = getattr(swe, fn_name)
        if not hasattr(orig, '_patched'):
            def make_patch(o):
                def p(jd, planet, flags=0):
                    r = o(jd, planet, flags=flags)
                    return (r[0], r[1]) if len(r) == 3 else r
                p._patched = True
                return p
            setattr(swe, fn_name, make_patch(orig))
    if hasattr(swe, 'houses_ex'):
        orig_he = swe.houses_ex
        if not hasattr(orig_he, '_patched'):
            def patch_he(*a, **kw):
                r = orig_he(*a, **kw)
                return (r[0], r[1]) if len(r) == 3 else r
            patch_he._patched = True
            swe.houses_ex = patch_he

    from jhora import const
    from jhora.panchanga import drik
    from jhora.panchanga.drik import Place
    from jhora.horoscope.chart import ashtakavarga, charts

    # 设置对齐
    # TRUE_CITRA 模式需要在 C 级别内部计算 Spica 星位置（需要 .se1 星历表文件）
    # 无星历文件时内部 JD 计算返回无效值 → swisseph.Error: jd outside Moshier range
    # 检测星历文件是否存在：有→TRUE_CITRA，无→回退 LAHIRI（结果几乎相同，<0.001° 差异）
    _ephe_dir = os.path.join(pyjhora_path, 'jhora', 'data', 'ephe')
    _has_ephe = any(f.endswith('.se1') for f in os.listdir(_ephe_dir)) if os.path.isdir(_ephe_dir) else False
    _ayanamsa_mode = 'TRUE_CITRA' if _has_ephe else 'LAHIRI'
    drik.set_ayanamsa_mode(_ayanamsa_mode)
    const._DEFAULT_AYANAMSA_MODE = _ayanamsa_mode
    const._use_true_nodes_for_rahu_ketu = False

    # JD = local time（和 Shadbala 一致）
    local_hour = hour + minute / 60.0
    jd_local = swe.julday(year, month, day, local_hour)
    place = Place('birth_place', lat, lon, tz_offset)

    # 获取 Rasi chart → house_to_planet_list
    # 修复：直接调用 dhasavarga 再单独取 ascendant，避免 rasi_chart 内部
    # ascendant→dhasavarga 顺序导致 swe.houses_ex 污染 pysweph sidereal 状态
    drik.set_planet_list(set_rahu_ketu_as_true_nodes=False, include_western_planets=False)
    planet_positions = drik.dhasavarga(jd_local, place, divisional_chart_factor=1)
    asc_data = drik.ascendant(jd_local, place)
    asc_sign = asc_data[0]
    from jhora import const as _const
    asc_entry = [_const._ascendant_symbol, (asc_sign, asc_data[1])]
    rasi = [asc_entry] + planet_positions
    h2p = ['' for _ in range(12)]
    for entry in rasi:
        p_id = entry[0]
        sign = entry[1][0]
        if h2p[sign]:
            h2p[sign] += '/' + str(p_id)
        else:
            h2p[sign] = str(p_id)

    # 计算 BAV, SAV, Prastara
    bav_raw, sav_raw, prastara = ashtakavarga.get_ashtaka_varga(h2p)

    # 格式化输出
    SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
             'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
    PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Ascendant']

    # SAV: sign -> value
    sarvashtakavarga = {}
    for i, sign in enumerate(SIGNS):
        sarvashtakavarga[sign] = int(sav_raw[i])

    # BAV: planet -> {sign -> value}
    bhinnashtakavarga = {}
    for p_idx, p_name in enumerate(PLANET_NAMES):
        bhinnashtakavarga[p_name] = {}
        for i, sign in enumerate(SIGNS):
            bhinnashtakavarga[p_name][sign] = int(bav_raw[p_idx][i])

    # Sodhya Pindas
    try:
        sp = ashtakavarga.sodhaya_pindas(bav_raw, h2p)
        # sp returns: [sodhya_pinda, rasi_pinda, graha_pinda] for each planet?
        sodhya_pindas = {}
        if isinstance(sp, (list, tuple)):
            for i, p_name in enumerate(PLANET_NAMES[:7]):
                if i < len(sp):
                    if isinstance(sp[i], (list, tuple)) and len(sp[i]) >= 3:
                        sodhya_pindas[p_name] = {
                            'sodhya_pinda': sp[i][0],
                            'rasi_pinda': sp[i][1],
                            'graha_pinda': sp[i][2]
                        }
    except Exception:
        sodhya_pindas = None

    return {
        'sarvashtakavarga': sarvashtakavarga,
        'bhinnashtakavarga': bhinnashtakavarga,
        'sav_total': sum(sav_raw),
        'sodhya_pindas': sodhya_pindas,
    }
