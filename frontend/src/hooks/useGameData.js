// hooks/useGameData.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useGameData = (version_data, position) => {
  const [letters, setLetters] = useState([]);
  const [words, setWords] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [proverbs, setProverbs] = useState([]);
  const [readingData, setReadingData] = useState([]);
  const [dedaenaData, setDedaenaData] = useState([]);
  const [staticData, setStaticData] = useState([]);
  // const [alphabetData, setAlphabetData] = useState({}); // ყველა ასოს დეტალური ინფორმაცია
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // console.log("dedaenaData:", dedaenaData);
  // Full alphabet load
  useEffect(() => {
    const loadDedaenaData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/dedaena/${version_data.dedaena_table}`);
        if (!response.status) throw new Error('Failed to load alphabet');
        setDedaenaData(response.data.data);
        setStaticData(response.data);
        // console.log("Fetched dedaena data:", response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDedaenaData();
  }, [version_data.dedaena_table]);
  // console.log("Dedaena data in hook:",position, dedaenaData[position-1]);
  // setWords(dedaenaData[position-1].words || []);
  // setSentences(dedaenaData[position-1]?.sentences || []);
  // Position data load
  useEffect(() => {
    const loadPositionData = async () => {
      try {
        setLoading(true);
        console.log("Fetching position data from:");
        const response = await api.get(`/dedaena/${version_data.dedaena_table}/position/${position}`);
        if (!response.status) throw new Error('Failed to load position data');
        const data = response.data;
        setLetters(data.letters || []);
        // console.log(`Fetched position ${position} data:`, data);
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

  return { letters, words, sentences, proverbs, readingData, dedaenaData, staticData, loading, error };
};