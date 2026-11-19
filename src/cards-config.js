import { CHARACTERS } from './characters.js';

export const PACK_BRAND = {
  logo: '多克多比',
  tearHint: '◀ 拖动封口 ▶',
  footerLeft: '多比图鉴',
  footerRight: '内含 5 张',
  microSpec: '第一辑 · 全息收藏卡',
  backHeadline: '第一辑 · 多比收藏卡\n每包 5 张',
  backSpec: '支持本地图鉴收藏',
};

export const PACK_THEMES = [
  { name: '苍蓝', code: '苍蓝收藏包', color: '#3552a0', highlight: '#a8ccff', shadow: '#101a42' },
  { name: '金焰', code: '金焰收藏包', color: '#9d4937', highlight: '#ffe3a1', shadow: '#371a26' },
  { name: '翡翠', code: '翡翠收藏包', color: '#206b67', highlight: '#aaf0c6', shadow: '#0f2534' },
];

export const RARITY_META = {
  common: { rank: 1, label: 'N', aura: 'transparent', shockColor: '#ffffff', metal: ['#fcf0d5', '#a28d68', '#eee1bc'], ink: '#3b3023' },
  rare: { rank: 2, label: 'R', aura: '#a493fc', shockColor: '#a493fc', metal: ['#e8edff', '#797da8', '#c4ccef'], ink: '#2a3158' },
  holo: { rank: 3, label: 'SR', aura: '#5ce6ff', shockColor: '#5ce6ff', metal: ['#e3fff9', '#549a9c', '#bfe6e1'], ink: '#21434b' },
  ultra: { rank: 4, label: 'SSR', aura: '#ffbe55', shockColor: '#ffd454', metal: ['#fff1ae', '#a77725', '#f4cf69'], ink: '#573611' },
  secret: { rank: 5, label: 'UR', aura: '#ff78d8', shockColor: '#ff7ae6', metal: ['#ffdc94', '#574067', '#e6a8e0'], ink: '#4a294b' },
};

// 试玩概率按卡位配置，空卡池的权重会跳过。稀有度和保底均为本作游戏规则。
export const PACK_RULES = {
  slots: [
    { common: 78, rare: 22 },
    { common: 74, rare: 22, holo: 4 },
    { common: 68, rare: 25, holo: 7 },
    { rare: 72, holo: 22, ultra: 6 },
    { holo: 54, ultra: 34, secret: 12 },
  ],
  pity: { packs: 3, weights: { ultra: 72, secret: 28 } },
  foilChance: 0.16,
  alternateChance: 0.08,
  specialChance: 0.03,
  specialWeights: { holo: 57, ultra: 34, secret: 9 },
};

export const EDITIONS = {
  base: { key: 'base', label: '普通版' },
  foil: { key: 'foil', label: '闪卡版' },
  alternate: { key: 'alternate', label: '异画版' },
};

// 首批 12 张保留原编号与配色；新增条目的编号与稀有度见 data/roster.json。
const expansionPalette = {
  common: ['#8c735c', '#373043'],
  rare: ['#776eb0', '#23264d'],
  holo: ['#538f94', '#164450'],
  ultra: ['#ad7d57', '#392951'],
  secret: ['#aa526c', '#36234e'],
};
const expansionCards = Object.entries(CHARACTERS)
  .filter(([, character]) => character.kind !== 'archive' && character.serial)
  .map(([id, { serial, rarity }]) => [id, serial, rarity, ...expansionPalette[rarity]]);

export const ASSET_ARCHIVE = Object.values(CHARACTERS).filter((c) => c.kind === 'archive');
export const CARD_TABLE = [
  ['cro', '001', 'common', '#b98b55', '#423449'],
  ['water', '002', 'common', '#408ba6', '#182d56'],
  ['fire', '003', 'common', '#ba6943', '#5c2534'],
  ['whirlwind', '004', 'common', '#5c9b78', '#1d4355'],
  ['ice', '005', 'rare', '#689eca', '#272b65'],
  ['wukong', '006', 'rare', '#b18852', '#563455'],
  ['rabbit', '007', 'rare', '#a87fa9', '#4a3761'],
  ['earth-dragon', '008', 'holo', '#a35d42', '#3c3f5a'],
  ['hurricane', '009', 'holo', '#61899d', '#19575c'],
  ['blaze-flame', '010', 'ultra', '#6d92df', '#1a2b64'],
  ['super-cro', '011', 'ultra', '#ad704e', '#392951'],
  ['phoenix', '012', 'secret', '#aa526c', '#36234e'],
  ...expansionCards,
].map(([characterId, serial, rarity, glow, shade]) => ({
  id: `${characterId}-s01`, characterId, serial, rarity, glow, shade, editions: CHARACTERS[characterId]?.alternateImage ? ['base', 'foil', 'alternate'] : ['base', 'foil'],
}));

function createCard(row) {
  const { name, kind, image, thumb, icon, alternateImage, alternateThumb, aliases, lowResolution } = CHARACTERS[row.characterId];
  if (row.editions.includes('alternate') && !alternateImage) {
    throw new Error(`异画版缺少素材：${row.id}`);
  }
  const meta = RARITY_META[row.rarity];
  const [light, dark, middle] = meta.metal;
  return {
    ...row,
    name, kind, icon, alternateImage, alternateThumb, aliases, lowResolution,
    rarityLabel: meta.label,
    rarityMark: '◆'.repeat(meta.rank),
    edgeColor: dark,
    textColor: meta.ink,
    frameBg: `linear-gradient(145deg, ${light}, ${middle} 22%, ${dark} 52%, ${light} 76%, ${dark})`,
    plaqueBg: `linear-gradient(145deg, ${light}, ${middle})`,
    windowBg: `radial-gradient(ellipse at 50% 38%, ${row.glow}, transparent 68%), linear-gradient(152deg, ${row.shade} 20%, #101728)`,
    character: { image, thumb },
  };
}

export const CARD_POOL = CARD_TABLE.map(createCard);
export const MASCOT_CONFIG = { image: CHARACTERS.phoenix.image };
