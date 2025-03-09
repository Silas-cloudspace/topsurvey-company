export interface Question {
  id: string
  text: string
  type: "text" | "textarea" | "single_choice" | "multiple_choice"
  required: boolean
  options?: string[]
}

export interface Survey {
  id: string
  title: string
  description: string
  questions: Question[]
  created_at: string
  responses?: number
}

export interface SurveyResponse {
  id: string
  survey_id: string
  answers: {
    question_id: string
    answer: string | string[]
  }[]
  created_at: string
}

