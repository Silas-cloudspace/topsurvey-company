"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Share2, AlertCircle } from "lucide-react"
import { API_URL } from "../configs/api"
import type { Survey, Question } from "../types/survey"

const SurveyDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = await fetch(`${API_URL}/surveys/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch survey")
        }
        const data = await response.json()
        setSurvey(data)

        // Initialize answers object
        const initialAnswers: Record<string, string | string[]> = {}
        data.questions.forEach((question: Question) => {
          if (question.type === "multiple_choice") {
            initialAnswers[question.id] = []
          } else {
            initialAnswers[question.id] = ""
          }
        })
        setAnswers(initialAnswers)
      } catch (err) {
        setError("Failed to load survey. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSurvey()
  }, [id])

  const handleInputChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleCheckboxChange = (questionId: string, value: string, checked: boolean) => {
    setAnswers((prev) => {
      const currentAnswers = (prev[questionId] as string[]) || []
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, value],
        }
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter((v) => v !== value),
        }
      }
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/surveys/${id}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          survey_id: id,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            question_id: questionId,
            answer,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit survey")
      }

      setSubmitted(true)
      setTimeout(() => {
        navigate("/")
      }, 3000)
    } catch (err) {
      setError("Failed to submit survey. Please try again.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const shareSurvey = () => {
    navigator.clipboard.writeText(window.location.href)
    alert("Survey link copied to clipboard!")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Survey Not Found</h2>
        <p className="text-gray-600 mb-6">The survey you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-8 rounded-md text-center">
        <h2 className="text-2xl font-semibold mb-4">Thank You!</h2>
        <p className="mb-4">Your response has been recorded successfully.</p>
        <p>Redirecting to home page...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{survey.title}</h1>
        <button onClick={shareSurvey} className="share-button text-blue-600 hover:text-blue-800">
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>

      <p className="text-gray-600 mb-8">{survey.description}</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {survey.questions.map((question: Question) => (
          <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-3">{question.text}</h3>

            {question.type === "text" && (
              <input
                type="text"
                className="form-input"
                value={answers[question.id] as string}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                required={question.required}
              />
            )}

            {question.type === "textarea" && (
              <textarea
                className="form-input min-h-[100px]"
                value={answers[question.id] as string}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                required={question.required}
              />
            )}

            {question.type === "single_choice" && (
              <div className="space-y-2">
                {question.options?.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={(answers[question.id] as string) === option}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      required={question.required}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === "multiple_choice" && (
              <div className="space-y-2">
                {question.options?.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={option}
                      checked={(answers[question.id] as string[])?.includes(option)}
                      onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Response"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SurveyDetail

