import { Link } from "react-router-dom"
import { PlusCircle } from "lucide-react"

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          TopSurvey
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            Surveys
          </Link>
          <Link
            to="/create"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            <PlusCircle size={18} />
            <span>Create Survey</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header

