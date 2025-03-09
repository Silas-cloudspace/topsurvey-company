"use client"

import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { PlusCircle, Trash2, GripVertical } from "lucide-react"
import { API_URL } from "../configs/api"
import type { Question } from "../types/survey"

const SurveyForm = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: `q-${Date.now()}`,
      text: "",
      type: "text",
      required: false,
      options: [],
    },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}-${questions.length}`,
        text: "",
        type: "text",
        required: false,
        options: [],
      },
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    }

    // Reset options when changing question type
    if (field === "type" && (value === "text" || value === "textarea")) {
      updatedQuestions[index].options = []
    }

    // Initialize options array for choice questions
    if (
      field === "type" &&
      (value === "single_choice" || value === "multiple_choice") &&
      !updatedQuestions[index].options?.length
    ) {
      updatedQuestions[index].options = [""]
    }

    setQuestions(updatedQuestions)
  }

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions]
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = []
    }
    updatedQuestions[questionIndex].options?.push("")
    setQuestions(updatedQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options![optionIndex] = value
      setQuestions(updatedQuestions)
    }
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions]
    if (updatedQuestions[questionIndex].options && updatedQuestions[questionIndex].options!.length > 1) {
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options!.filter(
        (_, i) => i !== optionIndex,
      )
      setQuestions(updatedQuestions)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!title.trim()) {
      setError("Survey title is required")
      return
    }

    if (!questions.every((q) => q.text.trim())) {
      setError("All questions must have text")
      return
    }

    if (
      !questions.every(
        (q) =>
          (q.type !== "single_choice" && q.type !== "multiple_choice") ||
          (q.options && q.options.length > 0 && q.options.every((opt) => opt.trim())),
      )
    ) {
      setError("All options must have text")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          questions,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create survey")
      }

      const data = await response.json()
      navigate(`/survey/${data.id}`)
    } catch (err) {
      setError("Failed to create survey. Please try again.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Survey</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="mb-4">
            <label htmlFor="title" className="form-label">
              Survey Title
            </label>
            <input
              id="title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter survey title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              className="form-input min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief description of your survey"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Questions</h2>

          {questions.map((question, index) => (
            <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="text-gray-400" size={20} />
                  <span className="font-medium">Question {index + 1}</span>
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="form-label">Question Text</label>
                <input
                  type="text"
                  className="form-input"
                  value={question.text}
                  onChange={(e) => updateQuestion(index, "text", e.target.value)}
                  placeholder="Enter your question"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Question Type</label>
                <select
                  className="form-input"
                  value={question.type}
                  onChange={(e) => updateQuestion(index, "type", e.target.value)}
                >
                  <option value="text">Short Answer</option>
                  <option value="textarea">Long Answer</option>
                  <option value="single_choice">Single Choice</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>

              {(question.type === "single_choice" || question.type === "multiple_choice") && (
                <div className="mb-4">
                  <label className="form-label">Options</label>
                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="form-input"
                          value={option}
                          onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          required
                        />
                        {question.options!.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index, optionIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(index)}
                      className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                    >
                      <PlusCircle size={16} />
                      <span>Add Option</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`required-${question.id}`}
                  checked={question.required}
                  onChange={(e) => updateQuestion(index, "required", e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor={`required-${question.id}`} className="text-sm">
                  Required question
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center gap-2"
          >
            <PlusCircle size={18} />
            <span>Add Question</span>
          </button>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate("/")} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating..." : "Create Survey"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SurveyForm

