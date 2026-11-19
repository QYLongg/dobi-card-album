import { CARD_POOL, EDITIONS, PACK_RULES, RARITY_META } from './cards-config.js';

export const STORAGE_KEY = 'dobi-card-album-v1';

export function emptyAlbum() {
  return { version: 1, packsOpened: 0, pityStreak: 0, owned: {} };
}

function validCount(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
}

export function parseAlbum(json) {
  const data = JSON.parse(json);
  if (!data || data.version !== 1 || !validCount(data.packsOpened) || !validCount(data.pityStreak)
      || data.pityStreak > data.packsOpened || !data.owned
      || typeof data.owned !== 'object' || Array.isArray(data.owned)) {
    throw new Error('无法识别的图鉴存档');
  }
  const album = { ...emptyAlbum(), packsOpened: data.packsOpened, pityStreak: data.pityStreak };
  for (const [id, count] of Object.entries(data.owned)) {
    if (!/^[a-z0-9][a-z0-9-]*:(base|foil|alternate)$/.test(id) || !validCount(count) || count === 0) {
      throw new Error('卡牌版本编号或数量无效');
    }
    album.owned[id] = count;
  }
  return album;
}

export function cardVersion(def, edition) {
  return `${def.id}:${edition}`;
}

export function ownedEditions(album, def) {
  return def.editions.map((key) => ({ ...EDITIONS[key], count: album.owned[cardVersion(def, key)] || 0 }));
}

export function unlockedCharacters(album) {
  return new Set(CARD_POOL.filter((def) => ownedEditions(album, def).some((e) => e.count)).map((def) => def.characterId));
}

export function collectPack(album, roll, pityMinimumRank) {
  const owned = { ...album.owned };
  const unlocked = unlockedCharacters(album);
  const entries = roll.entries.map((entry) => {
    const id = cardVersion(entry.def, entry.edition?.key || 'base');
    const isNew = !unlocked.has(entry.def.characterId);
    unlocked.add(entry.def.characterId);
    owned[id] = (owned[id] || 0) + 1;
    return { ...entry, isNew };
  });
  return {
    entries,
    album: {
      ...album,
      packsOpened: album.packsOpened + 1,
      pityStreak: roll.maxRank >= pityMinimumRank ? 0 : album.pityStreak + 1,
      owned,
    },
  };
}

function choose(items, random) {
  return items[Math.floor(random() * items.length)];
}

export function createPackRoller(pool = CARD_POOL, rules = PACK_RULES, random = Math.random) {
  const groups = {};
  for (const def of pool) {
    (groups[def.rarity] ||= []).push(def);
  }
  const weighted = (weights) => Object.entries(weights).filter(([rarity, weight]) => weight > 0 && groups[rarity]?.length);
  const availablePity = weighted(rules.pity.weights);
  const special = weighted(rules.specialWeights);
  const minRank = availablePity.length ? Math.min(...availablePity.map(([rarity]) => RARITY_META[rarity].rank)) : Infinity;

  if (!pool.length) throw new Error('请至少配置一张可抽取的卡牌');

  function roll(album) {
    const hitPity = availablePity.length && album.pityStreak >= rules.pity.packs - 1;
    const isGodPack = Boolean(special.length && random() < rules.specialChance);
    const used = new Set();
    const defs = rules.slots.map((weights, index) => {
      const finalSlot = index === rules.slots.length - 1;
      const active = finalSlot && hitPity ? availablePity : isGodPack ? special : weighted(weights);
      let threshold = random() * active.reduce((sum, [, weight]) => sum + weight, 0);
      let candidates = pool;
      for (const [rarity, weight] of active) {
        threshold -= weight;
        if (threshold < 0) {
          candidates = groups[rarity];
          break;
        }
      }
      const fresh = candidates.filter((def) => !used.has(def.id));
      const def = choose(fresh.length ? fresh : candidates, random);
      used.add(def.id);
      return def;
    });

    defs.sort((a, b) => RARITY_META[a.rarity].rank - RARITY_META[b.rarity].rank);
    const top = defs.pop();
    for (let i = defs.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [defs[i], defs[j]] = [defs[j], defs[i]];
    }
    defs.splice(1 + Math.floor(random() * 3), 0, top);
    const entries = defs.map((def) => {
      const variant = def.editions.includes('alternate') && random() < rules.alternateChance
        ? 'alternate'
        : def.editions.includes('foil') && (isGodPack || random() < rules.foilChance) ? 'foil' : 'base';
      return { def, edition: variant === 'base' ? null : EDITIONS[variant] };
    });
    return { entries, isGodPack, maxRank: RARITY_META[top.rarity].rank, topRarity: top.rarity };
  }

  return { roll, pityMinimumRank: minRank };
}
