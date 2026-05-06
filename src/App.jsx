import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import Assistant from './components/assistant/Assistant'
import Tasks from './components/tasks/Tasks'
import Teaching from './components/teaching/Teaching'
import Meetings from './components/meetings/Meetings'
import Leaders from './components/leaders/Leaders'
import Members from './components/members/Members'
import Reminders from './components/reminders/Reminders'
import Goals from './components/goals/Goals'
import Suggestions from './components/suggestions/Suggestions'
import Settings from './components/settings/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/teachings" element={<Teaching />} />
          <Route path="/teaching" element={<Navigate to="/teachings" replace />} />
          <Route path="/leaders" element={<Leaders />} />
          <Route path="/members" element={<Members />} />
          <Route path="/people" element={<Navigate to="/members" replace />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
