export const rollDiceExpr = (expr: string, rand: () => number = Math.random) => {
  expr = expr.replace(/\s+/g, '');
  const m = expr.match(/^([0-9]*)d([0-9]+)([+-][0-9]+)?$/i);
  if (!m) throw new Error('Invalid dice expression. Use NdM+K, e.g. 2d6+1');
  const n = m[1] === '' ? 1 : parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  const mod = m[3] ? parseInt(m[3], 10) : 0;
  if (n < 1 || sides < 1) throw new Error('Invalid dice numbers');
  const rolls = Array.from({ length: n }, () => 1 + Math.floor(rand() * sides));
  const total = rolls.reduce((s, v) => s + v, 0) + mod;
  return { rolls, mod, total };
};
