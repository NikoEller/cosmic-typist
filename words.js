/** Wortlisten nach Schwierigkeit. Umlaute werden bewusst trainiert. */
export const WORD_GROUPS = {
  easy: [
    // Kurze Wörter für schnelle Runden und einen motivierenden Einstieg.
    'ab', 'alt', 'am', 'arm', 'aus', 'bei', 'bis', 'blau', 'brot', 'da',
    'dach', 'das', 'dem', 'den', 'der', 'dir', 'drei', 'du', 'ei', 'ein',
    'eins', 'elf', 'er', 'es', 'eule', 'fein', 'fünf', 'für', 'gut', 'habt',
    'haus', 'heiß', 'heute', 'hier', 'huhn', 'ich', 'ihr', 'im', 'in', 'ja',
    'jetzt', 'junge', 'kalt', 'kein', 'klein', 'kurz', 'laut', 'lieb', 'los',
    'luft', 'mal', 'mann', 'mehr', 'mein', 'mit', 'mut', 'neu', 'neun', 'nur',
    'oben', 'oder', 'oft', 'oma', 'opa', 'ort', 'rot', 'rund', 'satt', 'sehr',
    'sie', 'so', 'tag', 'tee', 'tief', 'tier', 'toll', 'tot', 'tun', 'über',
    'um', 'und', 'uns', 'von', 'vor', 'warm', 'weg', 'wein', 'weit', 'wer',
    'wie', 'wir', 'wo', 'wut', 'zehn', 'zug', 'zwei',

    // Einfache Themenwörter mit vier bis acht Zeichen.
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
