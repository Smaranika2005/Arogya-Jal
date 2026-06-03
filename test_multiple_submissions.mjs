import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fabibqkmddcyfgrgyaxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYmlicWttZGRjeWZncmd5YXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDg3NTAsImV4cCI6MjA5NTEyNDc1MH0.1NnMFthy3pfotdbgw5cUi_oW0BMe-E7L-evITIQT8bs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('Inserting survey A...');
    const { data: parentA, error: pAErr } = await supabase
      .from('symptom_survey')
      .insert([{
        survey_date: '2026-06-03',
        pincode: '888888',
        municipality_id: 1,
        ward_no: 88,
        booth_no: 88,
        total_people_surveyed: 50
      }])
      .select('survey_id')
      .single();

    if (pAErr) throw pAErr;
    console.log('Survey A parent ID:', parentA.survey_id);

    const { error: cAErr } = await supabase
      .from('waterquality_survey')
      .insert([
        { survey_id: parentA.survey_id, wid: 1, ph: 7.0, turbidity: 1.0, tds: 100, no_waterbodies: 1, booth_no: 88 }
      ]);
    if (cAErr) throw cAErr;

    // Check count
    let { data: checkBefore } = await supabase.from('waterquality_survey').select('*').eq('survey_id', parentA.survey_id);
    console.log('Survey A child count before inserting B:', checkBefore.length);

    console.log('Inserting survey B...');
    const { data: parentB, error: pBErr } = await supabase
      .from('symptom_survey')
      .insert([{
        survey_date: '2026-06-03',
        pincode: '777777',
        municipality_id: 1,
        ward_no: 77,
        booth_no: 77,
        total_people_surveyed: 50
      }])
      .select('survey_id')
      .single();

    if (pBErr) throw pBErr;
    console.log('Survey B parent ID:', parentB.survey_id);

    const { error: cBErr } = await supabase
      .from('waterquality_survey')
      .insert([
        { survey_id: parentB.survey_id, wid: 2, ph: 7.5, turbidity: 2.0, tds: 120, no_waterbodies: 1, booth_no: 77 }
      ]);
    if (cBErr) throw cBErr;

    // Check if Survey A's child is still there
    let { data: checkAfterA } = await supabase.from('waterquality_survey').select('*').eq('survey_id', parentA.survey_id);
    let { data: checkAfterB } = await supabase.from('waterquality_survey').select('*').eq('survey_id', parentB.survey_id);
    console.log('Survey A child count after inserting B:', checkAfterA.length);
    console.log('Survey B child count:', checkAfterB.length);

    // Clean up
    console.log('Cleaning up...');
    await supabase.from('symptom_survey').delete().eq('pincode', '888888');
    await supabase.from('symptom_survey').delete().eq('pincode', '777777');
    console.log('Done.');

  } catch (err) {
    console.error(err);
  }
}

run();
