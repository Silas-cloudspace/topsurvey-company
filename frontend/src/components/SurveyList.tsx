"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Users, PlusCircle } from "lucide-react"
import { API_URL } from "../configs/api"
import type { Survey } from "../types/survey"

const SurveyList = () => {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await fetch(`${API_URL}/surveys`)
        if (!response.ok) {
          throw new Error("Failed to fetch surveys")
        }
        const data = await response.json()
        setSurveys(data)
      } catch (err) {
        setError("Failed to load surveys. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSurveys()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
  }

  if (surveys.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">No Surveys Available</h2>
        <p className="text-gray-600 mb-6">Be the first to create a survey!</p>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md transition-colors"
        >
          <PlusCircle size={20} />
          <span>Create Survey</span>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Available Surveys</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.map((survey) => (
          <Link
            key={survey.id}
            to={`/survey/${survey.id}`}
            className="survey-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-800">{survey.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{survey.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{survey.responses || 0} responses</span>
                </div>
                <div className="flex items-center gap-1 text-blue-500">
                  <span>Take Survey</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SurveyList

