/**
 * ტექსტის ანალიზის უტილიტები
 * გამოიყენება სიტყვების ნორმალიზაციისთვის, წინადადებების დაყოფის
 * და ტურის გამოცნობისთვის.
 */

// სიტყვის ნორმალიზაცია (პუნქტუაციის წაშლა)
export const normalizeWord = (word) => {
  if (typeof word !== "string") return "";
  return word.replace(/[.,!?;:()"""''«»—\-]/g, '').toLowerCase().trim();
};

// ტექსტის წინადადებებად დაყოფა
export const splitTextToSentences = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim());
};

// ტექსტის აბზაცებად დაყოფა
export const splitTextToParagraphs = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text.split(/\n+/).filter(p => p.trim());
};

// ყველა სიტყვის მეპის აგება dedaenaData-დან
// returns Map<normalizedWord, { tours: Set<position>, original: string }>
export const buildWordsMap = (dedaenaData) => {
  const wordsMap = new Map();
  dedaenaData.forEach(tour => {
    (tour.words || []).forEach(word => {
      const normalized = normalizeWord(word);
      if (!wordsMap.has(normalized)) {
        wordsMap.set(normalized, { tours: new Set(), original: word });
      }
      wordsMap.get(normalized).tours.add(tour.position);
    });
  });
  return wordsMap;
};

// სიტყვის ტურის გამოცნობა
export const detectWordTour = (word, allWordsMap, dedaenaData) => {
  const normalized = normalizeWord(word);
  if (!normalized) return null;

  const existingTours = allWordsMap.get(normalized)?.tours || new Set();
  const estimatedTour = dedaenaData.slice().reverse().find(tour => word.includes(tour.letter));

  return {
    word: normalized,
    originalWord: word,
    normalized,
    existsInTours: Array.from(existingTours),
    estimatedTour: estimatedTour
      ? { position: estimatedTour.position, letter: estimatedTour.letter }
      : null
  };
};

// წინადადების სიტყვებად დაყოფა და ანალიზი
export const analyzeSentence = (sentence, allWordsMap, dedaenaData) => {
  if (typeof sentence !== 'string' || !sentence.trim()) return [];
  const words = sentence.split(/\s+/).filter(w => w.length > 0);
  return words
    .map(word => detectWordTour(word, allWordsMap, dedaenaData))
    .filter(wordInfo => wordInfo !== null);
};

// ტექსტის მიხედვით ტურის გამოცნობა
export const detectTourForText = (text, dedaenaData) => {
  if (!text || !text.trim()) return null;
  const content = text.trim();
  const estimatedTour = dedaenaData.slice().reverse().find(tour => content.includes(tour.letter));
  if (!estimatedTour) return null;
  return {
    position: estimatedTour.position,
    letter: estimatedTour.letter,
    confidence: content[0] === estimatedTour.letter ? 'high' : 'medium'
  };
};
