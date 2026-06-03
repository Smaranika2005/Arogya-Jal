import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fabibqkmddcyfgrgyaxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYmlicWttZGRjeWZncmd5YXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDg3NTAsImV4cCI6MjA5NTEyNDc1MH0.1NnMFthy3pfotdbgw5cUi_oW0BMe-E7L-evITIQT8bs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: pSample } = await supabase.from('symptom_survey').select('*').limit(1);
    console.log('symptom_survey columns:', pSample && pSample.length > 0 ? Object.keys(pSample[0]) : 'no records, trying to test specifically');
    
    const columnsToTestP = ['user_id', 'created_by', 'asha_id', 'id', 'survey_id'];
    for (const col of columnsToTestP) {
      const { error } = await supabase.from('symptom_survey').select(col).limit(1);
      console.log(`symptom_survey contains '${col}':`, !error);
    }

    const { data: cSample } = await supabase.from('waterquality_survey').select('*').limit(1);
    console.log('waterquality_survey columns:', cSample && cSample.length > 0 ? Object.keys(cSample[0]) : 'no records');

  } catch (err) {
    console.error(err);
  }
}

run();
