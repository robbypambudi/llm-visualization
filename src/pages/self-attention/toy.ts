import type { Mat } from '../../lib/transformer'

/** Toy sentence for the whole chapter. "dia" should end up looking at "kucing". */
export const TOKENS = ['kucing', 'itu', 'tidur', 'karena', 'dia', 'lelah']

/**
 * Hand-made query/key space with three readable directions. In a real model these come from x·W_Q and x·W_K and
 * the directions have no names; here they are chosen by hand so the numbers can be read.
 */
export const QK_DIMS = ['makhluk', 'kejadian', 'keadaan']

/** What each token offers ("I am a creature", "I am an event", ...). */
export const K: Mat = [
  [2, 0, 0],
  [0.3, 0, 0],
  [0, 2, 0],
  [0, 0.3, 0.3],
  [0.8, 0, 0],
  [0, 0, 2],
]

/** What each token is looking for. */
export const Q: Mat = [
  [0, 1.5, 1],
  [2, 0, 0],
  [2, 0, 0],
  [0, 1.5, 1.5],
  [2.5, 0, 0],
  [2, 0, 0],
]

export const QUERY_MEANING = [
  'apa yang terjadi padaku?',
  'makhluk mana yang kutunjuk?',
  'siapa yang tidur?',
  'kejadian dan alasan apa yang kuhubungkan?',
  'siapa yang kumaksud?',
  'siapa yang lelah?',
]

export const V_DIMS = ['hewan', 'aktivitas', 'penghubung', 'kondisi']

/** What each token hands over once it is looked at. */
export const V: Mat = [
  [1, 0, 0, 0],
  [0.1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0.2, 0, 0, 0],
  [0, 0, 0, 1],
]
