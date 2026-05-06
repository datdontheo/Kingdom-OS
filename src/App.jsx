import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import Assistant from './components/assistant/Assistant'
import People from './components/people/People'
import Tasks from './components/tasks/Tasks'
import Teaching from './components/teaching/Teaching'
import Projects from './components/projects/Projects'
import Meetings from './components/meetings/Meetings'
import Settings from './components/settings/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/people" element={<People />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/teaching" element={<Teaching />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
