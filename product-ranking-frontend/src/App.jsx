import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Dashboard from './components/Dashboard'
import ComparisonCreate from './components/ComparisonCreate'
import ComparisonDetail from './components/ComparisonDetail'
import RankingResults from './components/RankingResults'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-primary">Product Ranking Dashboard</h1>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<ComparisonCreate />} />
            <Route path="/comparison/:id" element={<ComparisonDetail />} />
            <Route path="/comparison/:id/results" element={<RankingResults />} />
          </Routes>
        </main>
        
        <Toaster />
      </div>
    </Router>
  )
}

export default App
