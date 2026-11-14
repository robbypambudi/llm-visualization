/**
 * Toy corpus for the training demo. Every sentence is "subject verb [object] .",
 * built from the tables below so the next-word statistics are easy to reason about.
 */

export type WordGroup = 'hewan' | 'orang' | 'kerja' | 'benda'

const SUBJECT_VERBS: Record<string, string[]> = {
  kucing: ['makan', 'minum', 'tidur'],
  anjing: ['makan', 'minum', 'tidur'],
  kelinci: ['makan', 'tidur'],
  ibu: ['membaca', 'menulis', 'makan'],
  ayah: ['membaca', 'menulis', 'minum'],
  kakak: ['membaca', 'menulis'],
}

const VERB_OBJECTS: Record<string, string[]> = {
  makan: ['ikan', 'nasi', 'roti'],
  minum: ['susu', 'air', 'teh'],
  membaca: ['buku', 'koran'],
  menulis: ['surat', 'buku'],
  tidur: [],
}

export const WORD_GROUP: Record<string, WordGroup> = {
  kucing: 'hewan',
  anjing: 'hewan',
  kelinci: 'hewan',
  ibu: 'orang',
  ayah: 'orang',
  kakak: 'orang',
  makan: 'kerja',
  minum: 'kerja',
  membaca: 'kerja',
  menulis: 'kerja',
  tidur: 'kerja',
  ikan: 'benda',
  nasi: 'benda',
  roti: 'benda',
  susu: 'benda',
  air: 'benda',
  teh: 'benda',
  buku: 'benda',
  koran: 'benda',
  surat: 'benda',
}

export const GROUP_LABEL: Record<WordGroup, string> = {
  hewan: 'hewan',
  orang: 'orang',
  kerja: 'kata kerja',
  benda: 'benda',
}

export const GROUP_ORDER: WordGroup[] = ['hewan', 'orang', 'kerja', 'benda']

export const SENTENCES: string[] = Object.entries(SUBJECT_VERBS).flatMap(([s, verbs]) =>
  verbs.flatMap((v) => {
    const objects = VERB_OBJECTS[v]
    return objects.length ? objects.map((o) => `${s} ${v} ${o} .`) : [`${s} ${v} .`]
  }),
)
