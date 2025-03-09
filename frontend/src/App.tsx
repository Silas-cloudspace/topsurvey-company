import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import SurveyList from "./components/SurveyList"
import SurveyForm from "./components/SurveyForm"
import SurveyDetail from "./components/SurveyDetail"
import Header from "./components/Header"
import "./App.css"

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <Routes>
            <Route path="/" element={<SurveyList />} />
            <Route path="/survey/:id" element={<SurveyDetail />} />
            <Route path="/create" element={<SurveyForm />} />
          </Routes>
        </main>
        <footer className="bg-white py-6 border-t">
          <div className="container mx-auto text-center text-gray-500">
            Anonymous Survey Platform © {new Date().getFullYear()}
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App

