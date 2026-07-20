/** Wortlisten nach Schwierigkeit. Umlaute werden bewusst trainiert. */
export const WORD_GROUPS = {
  easy: [
    'apfel', 'baum', 'berg', 'blitz', 'blume', 'code', 'fuchs', 'garten',
    'hund', 'insel', 'kaffee', 'katze', 'komet', 'laser', 'meer', 'mond',
    'nebel', 'orbit', 'pixel', 'planet', 'regen', 'rakete', 'schule',
    'sonne', 'stern', 'tastatur', 'vogel', 'wald', 'wasser', 'wind', 'wolke'
  ],
  medium: [
    'abenteuer', 'antrieb', 'astronaut', 'atmosphäre', 'batterie', 'browser',
    'datenbank', 'energie', 'entdecken', 'fahrrad', 'galaxie', 'geschichte',
    'internet', 'kamera', 'konzentration', 'lichtjahr', 'meteor', 'mission',
    'netzwerk', 'programm', 'raumschiff', 'reaktion', 'rhythmus', 'satellit',
    'schwerkraft', 'signal', 'software', 'sonnenwind', 'sternbild', 'zitrone'
  ],
  hard: [
    'algorithmus', 'astronomie', 'ausdauer', 'bildschirm', 'fortschritt',
    'freiheit', 'geschwindigkeit', 'hardware', 'konstellation', 'kosmonaut',
    'mondbasis', 'sonnensystem', 'teleskop', 'universum', 'wunder',
    'zukunftsmission', 'raumstation', 'interstellar', 'energiekern',
    'kommunikation', 'galaxienhaufen', 'konzentration'
  ]
};

export function pickWord(difficulty) {
  const words = WORD_GROUPS[difficulty];
  return words[Math.floor(Math.random() * words.length)];
}
