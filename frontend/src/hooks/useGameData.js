// hooks/useGameData.js
import { useState, useEffect } from 'react';

export const useGameData = (version_data, position) => {
  const [letters, setLetters] = useState([]);
  const [words, setWords] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [fullAlphabet, setFullAlphabet] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Full alphabet load
  useEffect(() => {
    const loadFullAlphabet = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/dedaena/${version_data.dedaena_table}/33`);
        if (!response.ok) throw new Error('Failed to load alphabet');
        const data = await response.json();
        setFullAlphabet(data.letters || []);
        console.log('Full alphabet loaded:', data.letters);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadFullAlphabet();
  }, [version_data.dedaena_table]);

  // Position data load
  useEffect(() => {
    const loadPositionData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/dedaena/${version_data.dedaena_table}/${position}`);
        if (!response.ok) throw new Error('Failed to load position data');
        const data = await response.json();
        setLetters(data.letters || []);
        setWords(data.position_info?.words || []);
        setSentences(data.position_info?.sentences || []);
        console.log(`Data for position ${position} loaded:`, data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPositionData();
  }, [version_data.dedaena_table, position]);

  return { letters, words, sentences, fullAlphabet, loading, error };
};