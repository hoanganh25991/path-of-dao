#!/usr/bin/env node
/**
 * Generates 28 skill variant JSON files (sub-plan 23) → 40 total with 12 signatures.
 * Run: node tools/generate-skill-variants.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(root, 'content', 'skills');
const localeEn = join(root, 'content', 'locales', 'en', 'skills.json');
const localeVi = join(root, 'content', 'locales', 'vi', 'skills.json');

mkdirSync(skillsDir, { recursive: true });

const VARIANTS = [
  { intent: 'sword', kind: 'arc', rows: [
    { slug: 'crescent', v: 1, mult: 1.2, mana: 18, cd: 3000, halfAngle: 45 },
    { slug: 'cleave', v: 2, mult: 1.4, mana: 22, cd: 3500, halfAngle: 75 },
    { slug: 'rain', v: 3, mult: 1.1, mana: 25, cd: 5000, halfAngle: 70 },
    { slug: 'burst', v: 4, mult: 2.0, mana: 35, cd: 8000, halfAngle: 90 },
    { slug: 'heaven', v: 5, mult: 1.8, mana: 30, cd: 6000, halfAngle: 70 },
  ]},
  { intent: 'void', kind: 'bolt', rows: [
    { slug: 'rift', v: 1, mult: 1.3, mana: 18, cd: 2800 },
    { slug: 'tear', v: 2, mult: 1.5, mana: 22, cd: 3200, pull: 100 },
    { slug: 'surge', v: 3, mult: 1.1, mana: 24, cd: 4500, ticks: 2 },
    { slug: 'nova', v: 4, mult: 2.1, mana: 36, cd: 7500 },
    { slug: 'abyss', v: 5, mult: 1.9, mana: 32, cd: 5500, pull: 160 },
  ]},
  { intent: 'flame', kind: 'bolt', rows: [
    { slug: 'scorch', v: 1, mult: 1.2, mana: 18, cd: 3000 },
    { slug: 'ember', v: 2, mult: 1.4, mana: 20, cd: 3400 },
    { slug: 'pillar', v: 3, mult: 1.0, mana: 26, cd: 4800, aoe: true },
    { slug: 'lotus', v: 4, mult: 1.9, mana: 34, cd: 7200, aoe: true, ticks: 2 },
  ]},
  { intent: 'lightning', kind: 'bolt', rows: [
    { slug: 'fork', v: 1, mult: 1.25, mana: 20, cd: 3000 },
    { slug: 'arc', v: 2, mult: 1.45, mana: 22, cd: 3400 },
    { slug: 'storm', v: 3, mult: 1.1, mana: 28, cd: 5000, ticks: 2 },
    { slug: 'judgment', v: 4, mult: 2.0, mana: 38, cd: 7800 },
    { slug: 'tribulation', v: 5, mult: 1.85, mana: 32, cd: 5800 },
  ]},
  { intent: 'time', kind: 'bolt', rows: [
    { slug: 'halt', v: 1, mult: 1.1, mana: 16, cd: 4000 },
    { slug: 'drift', v: 2, mult: 1.3, mana: 18, cd: 4200 },
    { slug: 'loop', v: 3, mult: 1.0, mana: 22, cd: 5500 },
    { slug: 'stasis', v: 4, mult: 1.7, mana: 30, cd: 8000 },
    { slug: 'echo', v: 5, mult: 1.5, mana: 26, cd: 6200 },
  ]},
  { intent: 'life', kind: 'heal', rows: [
    { slug: 'bloom', v: 1, heal: 0.08, mana: 16, cd: 4000 },
    { slug: 'pulse', v: 2, heal: 0.1, mana: 18, cd: 4500 },
    { slug: 'surge', v: 3, heal: 0.14, mana: 24, cd: 6000 },
    { slug: 'spirit', v: 4, heal: 0.2, mana: 32, cd: 9000 },
  ]},
];

const enLocale = {};
const viLocale = {};

function buildSkill(intent, kind, row) {
  const id = `skill.${intent}.${row.slug}.v${row.v}`;
  const skill = {
    id,
    intent,
    nameKey: `${id}.name`,
    kind,
    manaCost: row.mana,
    skillMultiplier: row.mult ?? 1,
    cooldownMs: row.cd,
  };

  if (kind === 'heal') {
    skill.skillMultiplier = 1;
    skill.effects = [{ type: 'heal', healPct: row.heal }];
  } else if (kind === 'arc') {
    skill.effects = [{
      type: 'melee_arc',
      reach: 52,
      halfAngleDeg: row.halfAngle ?? 60,
      damage: { skillMultiplier: row.mult, damageType: 'physical' },
    }];
    if (row.ticks) {
      // multi-projectile variant
    }
  } else {
    const effect = {
      type: row.aoe ? 'aoe_circle' : 'projectile',
      damage: { skillMultiplier: row.mult, damageType: 'spirit' },
    };
    if (row.aoe) {
      effect.radius = 64;
      effect.ticks = row.ticks ?? 1;
      effect.tickIntervalMs = 300;
    } else {
      effect.speed = 420;
      effect.rangePx = 400;
      effect.hitRadius = 12;
      if (row.pull) effect.pullForce = row.pull;
    }
    if (row.ticks && !row.aoe) {
      skill.effects = [effect, { ...effect, damage: { skillMultiplier: row.mult * 0.8, damageType: 'spirit' } }];
    } else {
      skill.effects = [effect];
    }
  }

  const names = {
    sword: { crescent: ['Crescent Slash', 'Trăng Lưỡi'], cleave: ['Wide Cleave', 'Chém Rộng'], rain: ['Rain of Blades', 'Kiếm Vũ'], burst: ['Burst Cleave', 'Bạo Chém'], heaven: ['Heaven Flash', 'Thiên Quang'] },
    void: { rift: ['Void Rift', 'Hư Khe'], tear: ['Void Tear', 'Xé Hư'], surge: ['Void Surge', 'Hư Tăng'], nova: ['Void Nova', 'Hư Bạo'], abyss: ['Abyss Rend', 'Vực Trảm'] },
    flame: { scorch: ['Scorch Bolt', 'Thiêu Cầu'], ember: ['Ember Lance', 'Thanh Lửa'], pillar: ['Flame Pillar', 'Hỏa Trụ'], lotus: ['Lotus Bloom', 'Liên Hoa'] },
    lightning: { fork: ['Forked Bolt', 'Lôi Phân'], arc: ['Arc Strike', 'Cung Lôi'], storm: ['Storm Chain', 'Bão Liên'], judgment: ['Judgment Bolt', 'Thiên Phạt'], tribulation: ['Tribulation Arc', 'Kiếp Lôi'] },
    time: { halt: ['Time Halt', 'Định Thời'], drift: ['Time Drift', 'Trôi Thời'], loop: ['Time Loop', 'Vòng Thời'], stasis: ['Stasis Field', 'Đông Băng Thời'], echo: ['Time Echo', 'Vọng Thời'] },
    life: { bloom: ['Life Bloom', 'Hoa Sinh'], pulse: ['Vital Pulse', 'Mạch Sinh'], surge: ['Healing Surge', 'Sinh Tăng'], spirit: ['Spirit Bloom', 'Linh Hoa'] },
  };

  const [enName, viName] = names[intent]?.[row.slug] ?? [`${row.slug} v${row.v}`, `${row.slug} v${row.v}`];
  enLocale[`${id}.name`] = enName;
  enLocale[`${id}.desc`] = `Variant art — ${enName.toLowerCase()}.`;
  viLocale[`${id}.name`] = viName;
  viLocale[`${id}.desc`] = `Biến thể — ${viName}.`;

  return skill;
}

let count = 0;
for (const group of VARIANTS) {
  for (const row of group.rows) {
    const skill = buildSkill(group.intent, group.kind, row);
    writeFileSync(join(skillsDir, `${skill.id}.json`), `${JSON.stringify(skill, null, 2)}\n`);
    count++;
  }
}

writeFileSync(localeEn, `${JSON.stringify(enLocale, null, 2)}\n`);
writeFileSync(localeVi, `${JSON.stringify(viLocale, null, 2)}\n`);
console.log(`Wrote ${count} skill variants + locale stubs`);
