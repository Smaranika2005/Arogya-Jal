import { supabase } from '@/lib/supabase'

export type SurveyFormData = {
  surveyDate: string
  pincode: string
  municipality: string
  wardNo: string
  boothNo: string
  totalPeopleSurveyed: number
  symptoms: {
    diarrhoea: number
    abdominalPain: number
    dehydrationWeakness: number
    vomiting: number
    fever: number
    skinRashes: number
  }
  ageGroups: {
    children0to12: number
    adults13to60: number
    elderly60plus: number
  }
  avgSymptomDuration: string
  numberOfWaterBodies: number
  avgPH: number
  avgTurbidity: number
  avgTemperature: number
}

const SYMPTOM_KEYS = [
  'diarrhoea',
  'abdominalPain',
  'dehydrationWeakness',
  'vomiting',
  'fever',
  'skinRashes',
] as const

const AGE_GROUP_KEYS = [
  'children0to12',
  'adults13to60',
  'elderly60plus',
] as const

const roundPercentage = (value: number) => Number(value.toFixed(2))

const toPercentage = (count: number, totalPeople: number) => {
  if (!totalPeople) return 0
  return roundPercentage((count / totalPeople) * 100)
}

const toCount = (percentage: number, totalPeople: number) => {
  if (!totalPeople) return 0
  return Math.round((percentage / 100) * totalPeople)
}

export const normalizeSurveyForStorage = (form: SurveyFormData) => {
  const totalPeople = Number(form.totalPeopleSurveyed) || 0

  return {
    ...form,
    symptoms: Object.fromEntries(
      SYMPTOM_KEYS.map((key) => [key, toPercentage(form.symptoms[key], totalPeople)])
    ),
    ageGroups: Object.fromEntries(
      AGE_GROUP_KEYS.map((key) => [key, toPercentage(form.ageGroups[key], totalPeople)])
    ),
    surveyValueFormat: 'percentage' as const,
  }
}

export const denormalizeSurveyForForm = (surveyData: any): SurveyFormData => {
  if (!surveyData) {
    return surveyData
  }

  if (surveyData.surveyValueFormat !== 'percentage') {
    return surveyData as SurveyFormData
  }

  const totalPeople = Number(surveyData.totalPeopleSurveyed) || 0

  return {
    ...surveyData,
    symptoms: Object.fromEntries(
      SYMPTOM_KEYS.map((key) => [key, toCount(Number(surveyData.symptoms?.[key]) || 0, totalPeople)])
    ),
    ageGroups: Object.fromEntries(
      AGE_GROUP_KEYS.map((key) => [key, toCount(Number(surveyData.ageGroups?.[key]) || 0, totalPeople)])
    ),
  } as SurveyFormData
}

export async function createSurvey(userId: string, form: SurveyFormData) {
  const surveyData = normalizeSurveyForStorage(form)

  const { data, error } = await supabase
    .from('surveys')
    .insert([
      {
        user_id: userId,
        date_of_survey: form.surveyDate,
        booth_no: form.boothNo,
        pincode: form.pincode,
        municipality: form.municipality,
        ward_no: form.wardNo,
        total_people: form.totalPeopleSurveyed,
        survey_data: surveyData,
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSurvey(surveyId: string, userId: string, form: SurveyFormData) {
  const surveyData = normalizeSurveyForStorage(form)

  const { data, error } = await supabase
    .from('surveys')
    .update({
      date_of_survey: form.surveyDate,
      booth_no: form.boothNo,
      pincode: form.pincode,
      municipality: form.municipality,
      ward_no: form.wardNo,
      total_people: form.totalPeopleSurveyed,
      survey_data: surveyData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', surveyId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMySurveys(userId: string) {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getSurveyById(id: string, userId: string) {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

// Function to get all surveys for government dashboard
export async function getAllSurveys() {
  const { data, error } = await supabase
    .from('surveys')
    .select(`
      *,
      profiles(name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
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

export async function getSurveysForMunicipality(municipality: string) {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('municipality', municipality)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
