import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BookingPage } from './pages/booking/booking'
import { HomePage } from './pages/home/home'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:tenantSlug" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  )
}
