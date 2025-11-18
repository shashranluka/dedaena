import { useEffect, useState } from "react";



export const useGameData = (version_data, position) => {
    console.log('useGameData called with:', version_data, position);
  const [letters, setLetters] = useState([]);
  const [words, setWords] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [proverbs, setProverbs] = useState([]);
  const [readingData, setReadingData] = useState([]);
  const [staticData, setStaticData] = useState([]);
  const [alphabetData, setAlphabetData] = useState({}); // ყველა ასოს დეტალური ინფორმაცია
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Full alphabet load
  useEffect(() => {
    console.log('Loading full alphabet for table:', version_data.dedaena_table);
    const loadStaticData = async () => {
      try {
        setLoading(true);
        console.log('Loading full alphabet for table:', version_data.dedaena_table);
        // console.log('Fetching full alphabet from:', `http://localhost:8000/dedaena/${version_data.dedaena_table}/general-info`);
        const response = await fetch(`http://localhost:8000/dedaena/${version_data.dedaena_table}/general-info`);
        // console.log('Response status:', response.status);
        if (!response.ok) throw new Error('Failed to load alphabet');
        const data = await response.json();
        // setStaticData(data || []);
        console.log('Full alphabet loaded:', data);
      } catch (err) {
        // setError(err.message);
      } finally {
        // setLoading(false);
      }
    };
    loadStaticData();
  }, [version_data.dedaena_table]);

  // Position data load
  useEffect(() => {
    const loadPositionData = async () => {
      try {
        // setLoading(true);
        const response = await fetch(`http://localhost:8000/dedaena/${version_data.dedaena_table}/position/${position}`);
        if (!response.ok) throw new Error('Failed to load position data');
        const data = await response.json();
        // console.log(`Fetched position ${position} data:`, data);
        // setLetters(data.letters || []);
        // setWords(data.position_info?.words || []);
        // setSentences(data.position_info?.sentences || []);
        // setProverbs(data.position_info?.proverbs || []);
        // setReadingData(data.position_info?.reading || []);
        console.log(`Position ${position} data loaded:`, data);
      } catch (err) {
        // setError(err.message);
      } finally {
        // setLoading(false);
      }
    };
    loadPositionData();
  }, [version_data.dedaena_table, position]);

//   return { letters, words, sentences, proverbs, readingData, staticData, loading, error };
};
// export const getGeneralInfo = (version_data) => {
//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 // const response = await fetch(`http://localhost:8000/health`);
//                 const response = await fetch(`http://localhost:8000/dedaena/${version_data.dedaena_table}/general-info`);
//                 // const response = await fetch(`http://localhost:8000/dedaena/${version_data.dedaena_table}/general-info`);

//                 // const response = await fetch(`http://localhost:8000/dedaena`);
//                 console.log('General info response status:', response);
//                 return response;
//             } catch (err) {
//                 console.error('Failed to load general info:', err);
//                 return [];
//             }
//         };
//         fetchData();
//     }, []);
//     //
//     console.log('Fetching general info from:', `http://localhost:8000/dedaena/${version_data.dedaena_table}/general-info`);
// }

// export const getPositionData = async (version_data, position) => {
//     try {
//         const response = await fetch(`http://localhost:8000/dedaena/${version_data.dedaena_table}/position/${position}`);
//         console.log(`Position ${position} data response status:`, response);
//         return response.json();
//     } catch (err) {
//         console.error(`Failed to load data for position ${position}:`, err);
//         return {};
//     }
// }
