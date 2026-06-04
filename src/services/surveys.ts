import { supabase } from '@/lib/supabase'

export type WaterBodyAssessment = {
  wid: number
  ph: string
  turbidity: string
  tds: string
  rank?: number
}

export type SurveyFormData = {
  surveyDate: string
  pincode: string
  municipality: string
  wardNo: string
  boothNo: string
  totalPeopleSurveyed: number | ''
  symptoms: {
    diarrhoea: number | ''
    abdominalPain: number | ''
    dehydrationWeakness: number | ''
    vomiting: number | ''
    fever: number | ''
    skinRashes: number | ''
  }
  ageGroups: {
    children0to12: number | ''
    adults13to60: number | ''
    elderly60plus: number | ''
  }
  avgSymptomDuration: string
  numberOfWaterBodies: number | ''
  waterBodyAssessments?: WaterBodyAssessment[]
}

export async function createSurvey(userId: string, form: SurveyFormData) {
  // Look up municipality_id
  const { data: muniList, error: muniError } = await supabase
    .from('municipalities')
    .select('*')

  if (muniError) throw new Error(`Municipality lookup failed: ${muniError.message}`)
  const muni = (muniList || []).find((m: any) => (m.municipality_name === form.municipality || m.name === form.municipality))
  if (!muni) throw new Error(`Municipality "${form.municipality}" not found.`)
  const municipalityId = muni.municipality_id !== undefined ? muni.municipality_id : muni.id

  // 1. Insert parent survey into symptom_survey
  const { data: parentData, error: parentError } = await supabase
    .from('symptom_survey')
    .insert([
      {
        survey_date: form.surveyDate,
        pincode: form.pincode,
        municipality_id: municipalityId,
        ward_no: form.wardNo,
        booth_no: form.boothNo,
        user_id: userId,
        total_people_surveyed: Number(form.totalPeopleSurveyed) || 0,
        diarrhoea_count: Number(form.symptoms.diarrhoea) || 0,
        abdominal_pain_count: Number(form.symptoms.abdominalPain) || 0,
        dehydration_count: Number(form.symptoms.dehydrationWeakness) || 0,
        vomiting_count: Number(form.symptoms.vomiting) || 0,
        fever_count: Number(form.symptoms.fever) || 0,
        skin_rashes_count: Number(form.symptoms.skinRashes) || 0,
        child_count: Number(form.ageGroups.children0to12) || 0,
        adult_count: Number(form.ageGroups.adults13to60) || 0,
        senior_count: Number(form.ageGroups.elderly60plus) || 0,
        avg_symptom_duration: parseFloat(form.avgSymptomDuration) || 0
      }
    ])
    .select('survey_id, booth_no')
    .single()

  if (parentError) throw parentError

  const surveyId = parentData.survey_id
  const boothNo = parentData.booth_no

  // 2. Insert child records into waterquality_survey
  if (form.waterBodyAssessments && form.waterBodyAssessments.length > 0) {
    const childRows = form.waterBodyAssessments.map((item, index) => ({
      survey_id: surveyId,
      booth_no: boothNo,
      wid: item.wid,
      ph: parseFloat(item.ph) || 0,
      turbidity: parseFloat(item.turbidity) || 0,
      tds: parseFloat(item.tds) || 0,
      no_waterbodies: Number(form.numberOfWaterBodies) || 0,
      rank: item.rank || (index + 1)
    }))

    const { error: childError } = await supabase
      .from('waterquality_survey')
      .insert(childRows)

    if (childError) throw childError
  }

  return parentData
}

export async function updateSurvey(surveyId: string, userId: string, form: SurveyFormData) {
  // Look up municipality_id
  const { data: muniList, error: muniError } = await supabase
    .from('municipalities')
    .select('*')

  if (muniError) throw new Error(`Municipality lookup failed: ${muniError.message}`)
  const muni = (muniList || []).find((m: any) => (m.municipality_name === form.municipality || m.name === form.municipality))
  if (!muni) throw new Error(`Municipality "${form.municipality}" not found.`)
  const municipalityId = muni.municipality_id !== undefined ? muni.municipality_id : muni.id

  // 1. Update symptom_survey
  const { data: parentData, error: parentError } = await supabase
    .from('symptom_survey')
    .update({
      survey_date: form.surveyDate,
      pincode: form.pincode,
      municipality_id: municipalityId,
      ward_no: form.wardNo,
      booth_no: form.boothNo,
      user_id: userId,
      total_people_surveyed: Number(form.totalPeopleSurveyed) || 0,
      diarrhoea_count: Number(form.symptoms.diarrhoea) || 0,
      abdominal_pain_count: Number(form.symptoms.abdominalPain) || 0,
      dehydration_count: Number(form.symptoms.dehydrationWeakness) || 0,
      vomiting_count: Number(form.symptoms.vomiting) || 0,
      fever_count: Number(form.symptoms.fever) || 0,
      skin_rashes_count: Number(form.symptoms.skinRashes) || 0,
      child_count: Number(form.ageGroups.children0to12) || 0,
      adult_count: Number(form.ageGroups.adults13to60) || 0,
      senior_count: Number(form.ageGroups.elderly60plus) || 0,
      avg_symptom_duration: parseFloat(form.avgSymptomDuration) || 0
    })
    .eq('survey_id', surveyId)
    .select('survey_id, booth_no')
    .single()

  if (parentError) throw parentError

  // 2. Delete old child records
  const { error: deleteError } = await supabase
    .from('waterquality_survey')
    .delete()
    .eq('survey_id', surveyId)

  if (deleteError) throw deleteError

  // 3. Insert new child records
  if (form.waterBodyAssessments && form.waterBodyAssessments.length > 0) {
    const childRows = form.waterBodyAssessments.map((item, index) => ({
      survey_id: surveyId,
      booth_no: parentData.booth_no,
      wid: item.wid,
      ph: parseFloat(item.ph) || 0,
      turbidity: parseFloat(item.turbidity) || 0,
      tds: parseFloat(item.tds) || 0,
      no_waterbodies: Number(form.numberOfWaterBodies) || 0,
      rank: item.rank || (index + 1)
    }))

    const { error: childError } = await supabase
      .from('waterquality_survey')
      .insert(childRows)

    if (childError) throw childError
  }

  return parentData
}

export async function getMySurveys(userId: string) {
  // Fetch parent surveys
  const { data: parentSurveys, error: parentError } = await supabase
    .from('symptom_survey')
    .select('*, municipalities(municipality_name)')
    .eq('user_id', userId)
    .order('survey_date', { ascending: false })

  if (parentError) throw parentError

  // Fetch child surveys
  const { data: childSurveys, error: childError } = await supabase
    .from('waterquality_survey')
    .select('*')

  if (childError) throw childError

  // Group child surveys by survey_id
  const childMap = new Map<number, any[]>()
  for (const row of (childSurveys || [])) {
    if (!childMap.has(row.survey_id)) {
      childMap.set(row.survey_id, [])
    }
    childMap.get(row.survey_id)!.push(row)
  }

  // Map to the shape expected by frontend components (e.g. ASHAProfile)
  return (parentSurveys || []).map((row: any) => {
    const kids = childMap.get(row.survey_id) || []
    const noWaterBodies = kids[0]?.no_waterbodies || 0

    let avgPH = 0
    let avgTurbidity = 0
    let avgTds = 0
    if (kids.length > 0) {
      const sumPH = kids.reduce((acc, k) => acc + (k.ph || 0), 0)
      const sumTurbidity = kids.reduce((acc, k) => acc + (k.turbidity || 0), 0)
      const sumTds = kids.reduce((acc, k) => acc + (k.tds || 0), 0)
      avgPH = Number((sumPH / kids.length).toFixed(2))
      avgTurbidity = Number((sumTurbidity / kids.length).toFixed(2))
      avgTds = Number((sumTds / kids.length).toFixed(2))
    }

    return {
      id: String(row.survey_id),
      booth_no: String(row.booth_no || ''),
      total_people: row.total_people_surveyed || 0,
      created_at: new Date(row.survey_date).toISOString(),
      survey_data: {
        surveyDate: row.survey_date,
        pincode: row.pincode,
        municipality: row.municipalities?.municipality_name || '',
        wardNo: row.ward_no,
        boothNo: row.booth_no,
        totalPeopleSurveyed: row.total_people_surveyed,
        symptoms: {
          diarrhoea: row.diarrhoea_count || 0,
          abdominalPain: row.abdominal_pain_count || 0,
          dehydrationWeakness: row.dehydration_count || 0,
          vomiting: row.vomiting_count || 0,
          fever: row.fever_count || 0,
          skinRashes: row.skin_rashes_count || 0,
        },
        ageGroups: {
          children0to12: row.child_count || 0,
          adults13to60: row.adult_count || 0,
          elderly60plus: row.senior_count || 0,
        },
        avgSymptomDuration: String(row.avg_symptom_duration || ''),
        numberOfWaterBodies: noWaterBodies,
        avgPH: avgPH,
        avgTurbidity: avgTurbidity,
        avgTemperature: 0,
        waterBodyAssessments: kids.map(k => ({
          wid: k.wid,
          ph: String(k.ph || ''),
          turbidity: String(k.turbidity || ''),
          tds: String(k.tds || ''),
          rank: k.rank,
        }))
      }
    }
  })
}

export async function getSurveyById(id: string, userId: string) {
  // Fetch parent
  const { data: parentData, error: parentError } = await supabase
    .from('symptom_survey')
    .select('*, municipalities(municipality_name)')
    .eq('survey_id', id)
    .eq('user_id', userId)
    .single()

  if (parentError) throw parentError

  // Fetch children
  const { data: childData, error: childError } = await supabase
    .from('waterquality_survey')
    .select('*')
    .eq('survey_id', id)

  if (childError) throw childError

  // Merge into SurveyFormData structure
  const formData: SurveyFormData = {
    surveyDate: parentData.survey_date,
    pincode: parentData.pincode,
    municipality: parentData.municipalities?.municipality_name || '',
    wardNo: parentData.ward_no,
    boothNo: parentData.booth_no,
    totalPeopleSurveyed: parentData.total_people_surveyed,
    symptoms: {
      diarrhoea: parentData.diarrhoea_count || 0,
      abdominalPain: parentData.abdominal_pain_count || 0,
      dehydrationWeakness: parentData.dehydration_count || 0,
      vomiting: parentData.vomiting_count || 0,
      fever: parentData.fever_count || 0,
      skinRashes: parentData.skin_rashes_count || 0,
    },
    ageGroups: {
      children0to12: parentData.child_count || 0,
      adults13to60: parentData.adult_count || 0,
      elderly60plus: parentData.senior_count || 0,
    },
    avgSymptomDuration: String(parentData.avg_symptom_duration || ''),
    numberOfWaterBodies: childData?.[0]?.no_waterbodies || 0,
    waterBodyAssessments: (childData || []).map(item => ({
      wid: item.wid,
      ph: String(item.ph || ''),
      turbidity: String(item.turbidity || ''),
      tds: String(item.tds || ''),
      rank: item.rank
    }))
  }

  return {
    survey_data: formData
  } as any
}

// Function to get all surveys for government dashboard
export async function getAllSurveys() {
  const { data: parentSurveys, error: parentError } = await supabase
    .from('symptom_survey')
    .select('*, municipalities(municipality_name)')
    .order('survey_date', { ascending: false })

  if (parentError) throw parentError

  const { data: childSurveys, error: childError } = await supabase
    .from('waterquality_survey')
    .select('*')

  if (childError) throw childError

  const childMap = new Map<number, any[]>()
  for (const row of (childSurveys || [])) {
    if (!childMap.has(row.survey_id)) {
      childMap.set(row.survey_id, [])
    }
    childMap.get(row.survey_id)!.push(row)
  }

  return (parentSurveys || []).map((row: any) => {
    const kids = childMap.get(row.survey_id) || []
    const noWaterBodies = kids[0]?.no_waterbodies || 0

    let avgPH = 0
    let avgTurbidity = 0
    if (kids.length > 0) {
      avgPH = kids.reduce((acc, k) => acc + (k.ph || 0), 0) / kids.length
      avgTurbidity = kids.reduce((acc, k) => acc + (k.turbidity || 0), 0) / kids.length
    }

    return {
      id: String(row.survey_id),
      booth_no: String(row.booth_no || ''),
      total_people: row.total_people_surveyed || 0,
      created_at: new Date(row.survey_date).toISOString(),
      survey_data: {
        surveyDate: row.survey_date,
        pincode: row.pincode,
        municipality: row.municipalities?.municipality_name || '',
        wardNo: row.ward_no,
        boothNo: row.booth_no,
        totalPeopleSurveyed: row.total_people_surveyed,
        symptoms: {
          diarrhoea: row.diarrhoea_count || 0,
          abdominalPain: row.abdominal_pain_count || 0,
          dehydrationWeakness: row.dehydration_count || 0,
          vomiting: row.vomiting_count || 0,
          fever: row.fever_count || 0,
          skinRashes: row.skin_rashes_count || 0,
        },
        ageGroups: {
          children0to12: row.child_count || 0,
          adults13to60: row.adult_count || 0,
          elderly60plus: row.senior_count || 0,
        },
        avgSymptomDuration: String(row.avg_symptom_duration || ''),
        numberOfWaterBodies: noWaterBodies,
        avgPH: Number(avgPH.toFixed(2)),
        avgTurbidity: Number(avgTurbidity.toFixed(2)),
        avgTemperature: 0
      }
    }
  })
}

// Function to get all ASHA workers count for government dashboard
export async function getAshaWorkersCount() {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('role', 'asha_worker')

  if (error) throw error
  return count || 0
}

export async function getAshaWorkersList() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'asha_worker')

  if (error) throw error
  return data || []
}

export async function getSymptomSurveysForMunicipality(municipalityId: number) {
  // Fetch parent surveys
  const { data: parentSurveys, error: parentError } = await supabase
    .from('symptom_survey')
    .select('*, municipalities(municipality_name)')
    .eq('municipality_id', municipalityId)
    .order('survey_date', { ascending: false })

  if (parentError) throw parentError

  if (!parentSurveys || parentSurveys.length === 0) {
    return []
  }

  // Fetch child surveys
  const surveyIds = parentSurveys.map((p: any) => p.survey_id)
  const { data: childSurveys, error: childError } = await supabase
    .from('waterquality_survey')
    .select('*')
    .in('survey_id', surveyIds)

  if (childError) throw childError

  // Group child surveys by survey_id
  const childMap = new Map<number, any[]>()
  for (const row of (childSurveys || [])) {
    if (!childMap.has(row.survey_id)) {
      childMap.set(row.survey_id, [])
    }
    childMap.get(row.survey_id)!.push(row)
  }

  // Map to the shape expected by frontend components
  return parentSurveys.map((row: any) => {
    const kids = childMap.get(row.survey_id) || []
    const noWaterBodies = kids[0]?.no_waterbodies || 0

    let avgPH = 0
    let avgTurbidity = 0
    let avgTds = 0
    if (kids.length > 0) {
      const sumPH = kids.reduce((acc, k) => acc + (k.ph || 0), 0)
      const sumTurbidity = kids.reduce((acc, k) => acc + (k.turbidity || 0), 0)
      const sumTds = kids.reduce((acc, k) => acc + (k.tds || 0), 0)
      avgPH = sumPH / kids.length
      avgTurbidity = sumTurbidity / kids.length
      avgTds = sumTds / kids.length
    }

    return {
      id: String(row.survey_id),
      booth_no: String(row.booth_no || ''),
      total_people: row.total_people_surveyed || 0,
      created_at: new Date(row.survey_date).toISOString(),
      user_id: row.user_id,
      survey_data: {
        surveyDate: row.survey_date,
        pincode: row.pincode,
        municipality: row.municipalities?.municipality_name || '',
        wardNo: row.ward_no,
        boothNo: row.booth_no,
        totalPeopleSurveyed: row.total_people_surveyed,
        symptoms: {
          diarrhoea: row.diarrhoea_count || 0,
          abdominalPain: row.abdominal_pain_count || 0,
          dehydrationWeakness: row.dehydration_count || 0,
          vomiting: row.vomiting_count || 0,
          fever: row.fever_count || 0,
          skinRashes: row.skin_rashes_count || 0,
        },
        ageGroups: {
          children0to12: row.child_count || 0,
          adults13to60: row.adult_count || 0,
          elderly60plus: row.senior_count || 0,
        },
        avgSymptomDuration: String(row.avg_symptom_duration || ''),
        numberOfWaterBodies: noWaterBodies,
        avgPH: Number(avgPH.toFixed(2)),
        avgTurbidity: Number(avgTurbidity.toFixed(2)),
        avgTds: Number(avgTds.toFixed(2)),
        avgTemperature: 0,
        waterBodyAssessments: kids.map(k => ({
          wid: k.wid,
          ph: String(k.ph || ''),
          turbidity: String(k.turbidity || ''),
          tds: String(k.tds || ''),
          rank: k.rank
        }))
      }
    }
  })
}

