// shared.js — lógica e constantes compartilhadas entre index.html e token-panel.html
// IMPORTANTE: se você mudar de hospedagem ou renomear o repositório, atualize BASE_URL abaixo.
export const BASE_URL = "https://guedesp123.github.io/Extens-o-owlbear---Pessoal";

export const ID = "com.starofthecity.initiative";
export const META_KEY = `${ID}/state`;
export const ITEM_META_KEY = `${ID}/combatant`;
export const DICE_SIZES = [4, 6, 8, 10, 12, 20];
export const TYPE_LABEL = { pc: "Jogador", ally: "Aliado", enemy: "Inimigo" };

export function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2) + Date.now();
}

export function clamp(v, min, max) {
  v = Number(v);
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function rollOne(size) {
  return 1 + Math.floor(Math.random() * size);
}

/** Rola um único dado de um certo tamanho, aplicando os modificadores do combatente. */
export function rollSingleDieValue(c, size) {
  if (c.paralyze) {
    return { value: 1, breakdown: "Paralisado — travado em 1" };
  }
  const base = rollOne(size);
  const total = base + Number(c.bruto || 0) + Number(c.accel || 0) - Number(c.bind || 0);
  const value = Math.max(1, total);
  const parts = [`d${size}: ${base}`];
  if (c.bruto) parts.push(`${c.bruto > 0 ? "+" : ""}${c.bruto} bruto`);
  if (c.accel) parts.push(`+${c.accel} aceleração`);
  if (c.bind) parts.push(`-${c.bind} bind`);
  if (total < 1) parts.push("ajustado ao mínimo de 1");
  return { value, breakdown: parts.join(", ") };
}

/** Regenera o conjunto principal de dados (diceCount × diceSize) e rerola
 *  quaisquer "dados outros" (extras) já existentes, preservando-os. */
export function rollCombatantDice(c) {
  const dice = [];
  for (let i = 0; i < c.diceCount; i++) {
    const { value, breakdown } = rollSingleDieValue(c, c.diceSize);
    dice.push({ id: uid(), value, status: "available", breakdown, size: c.diceSize, extra: false });
  }
  const extras = (c.dice || []).filter((d) => d.extra);
  for (const ex of extras) {
    const { value, breakdown } = rollSingleDieValue(c, ex.size);
    dice.push({ id: ex.id, value, status: "available", breakdown, size: ex.size, extra: true });
  }
  return dice;
}

/** Rerola apenas um dado específico já existente (mantém o tamanho dele). */
export function rerollOneDie(c, die) {
  const { value, breakdown } = rollSingleDieValue(c, die.size || c.diceSize);
  die.value = value;
  die.breakdown = breakdown;
  die.status = "available";
}

/** Define manualmente o valor de um dado (mestre decide o número). */
export function setManualDieValue(die, newValue) {
  const v = Math.max(1, Math.floor(Number(newValue)) || 1);
  die.value = v;
  die.breakdown = `Definido manualmente: ${v}`;
}

/** Adiciona um "dado outro" (tamanho avulso, diferente do padrão do combatente). */
export function addExtraDie(c, size) {
  const { value, breakdown } = rollSingleDieValue(c, size);
  const die = { id: uid(), value, status: "available", breakdown, size, extra: true };
  c.dice = c.dice || [];
  c.dice.push(die);
  return die;
}

export function defaultCombatant(overrides) {
  return Object.assign(
    {
      id: uid(),
      name: "Combatente",
      type: "pc",
      diceCount: 3,
      diceSize: 8,
      bruto: 0,
      bind: 0,
      accel: 0,
      paralyze: false,
      dice: [],
    },
    overrides
  );
}

/** Maior valor entre os dados disponíveis de um combatente (0 se nenhum). */
export function highestAvailable(c) {
  let max = 0;
  for (const d of c.dice || []) {
    if (d.status === "available" && d.value > max) max = d.value;
  }
  return max;
}
