// hooks/useGameData.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useGameData = (version_data, position) => {
  const [letters, setLetters] = useState([]);
  const [words, setWords] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [proverbs, setProverbs] = useState([]);
  const [readingData, setReadingData] = useState([]);
  const [staticData, setStaticData] = useState([]);
  const [alphabetData, setAlphabetData] = useState({}); // ყველა ასოს დეტალური ინფორმაცია
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  console.log("staticData:", staticData);
  // Full alphabet load
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/dedaena/${version_data.dedaena_table}/general-info`);
        // const response = await fetch(`http://localhost:8000/api/dedaena/${version_data.dedaena_table}/general-info`);
        if (!response.status) throw new Error('Failed to load alphabet');
        setStaticData(response.data);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadStaticData();
  }, [version_data.dedaena_table]);

  // Position data load
  useEffect(() => {
    const loadPositionData = async () => {
      try {
        setLoading(true);
        console.log("Fetching position data from:");
        const response = await api.get(`/dedaena/${version_data.dedaena_table}/position/${position}`);
        // const response = await fetch(`http://localhost:8000/api/dedaena/${version_data.dedaena_table}/position/${position}`);
        if (!response.status) throw new Error('Failed to load position data');
        const data = response.data;
        setLetters(data.letters || []);
        setWords(data.position_info?.words || []);
        setSentences(data.position_info?.sentences || []);
        setProverbs(data.position_info?.proverbs || []);
        setReadingData(data.position_info?.reading || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPositionData();
  }, [version_data.dedaena_table, position]);

  return { letters, words, sentences, proverbs, readingData, staticData, loading, error };
};