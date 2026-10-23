import { useState } from 'react'
import SearchForm from './components/SearchForm'
import BrandList from './components/BrandList'
import AnalogTable from './components/AnalogTable'

export default function App() {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_API_KEY || '')

  return (
    <div className="container py-4">
      <header className="mb-4">
        <h1 className="h3 mb-1">Подбор аналогов автозапчастей</h1>
        <p className="text-secondary mb-0">
          Двухэтапный подбор по веб-сервису «Проценка»: артикул &rarr; производитель &rarr; аналоги и предложения.
        </p>
      </header>

      <SearchForm apiKey={apiKey} onApiKeyChange={setApiKey} />
      <BrandList apiKey={apiKey} />
      <AnalogTable />
    </div>
  )
}
