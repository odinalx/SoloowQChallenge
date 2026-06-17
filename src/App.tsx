import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import LiveGamesPage from '@/pages/LiveGamesPage'
import StatisticsPage from '@/pages/StatisticsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="en-direct" element={<LiveGamesPage />} />
        <Route path="statistiques" element={<StatisticsPage />} />
      </Route>
    </Routes>
  )
}
