import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBrands, numberChanged, searchReset } from '../store/searchSlice'

const DEBOUNCE_MS = 500
const MIN_NUMBER_LENGTH = 2

export default function SearchForm({ apiKey, onApiKeyChange }) {
  const dispatch = useDispatch()
  const { number, brands } = useSelector((state) => state.search)
  const timer = useRef(null)

  const isLoading = brands.status === 'loading'

  useEffect(() => () => clearTimeout(timer.current), [])

  const runSearch = (value, key) => {
    if (value.trim().length < MIN_NUMBER_LENGTH || !key.trim()) return
    dispatch(fetchBrands({ key: key.trim(), number: value.trim() }))
  }

  const handleNumberChange = (event) => {
    const value = event.target.value
    dispatch(numberChanged(value))

    clearTimeout(timer.current)
    timer.current = setTimeout(() => runSearch(value, apiKey), DEBOUNCE_MS)
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return
    clearTimeout(timer.current)
    runSearch(number, apiKey)
  }

  const handleReset = () => {
    clearTimeout(timer.current)
    dispatch(searchReset())
  }

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-12 col-md-7">
            <label htmlFor="part-number" className="form-label fw-semibold">
              1. Артикул детали
            </label>
            <div className="input-group">
              <input
                id="part-number"
                type="search"
                className="form-control"
                placeholder="Например: 01089"
                value={number}
                onChange={handleNumberChange}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                autoFocus
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => runSearch(number, apiKey)}
                disabled={isLoading || number.trim().length < MIN_NUMBER_LENGTH}
              >
                {isLoading ? 'Ищем…' : 'Найти'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={handleReset} disabled={!number}>
                Сброс
              </button>
            </div>
            <div className="form-text">Поиск выполняется автоматически через {DEBOUNCE_MS} мс после ввода.</div>
          </div>

          <div className="col-12 col-md-5">
            <label htmlFor="api-key" className="form-label fw-semibold">
              Ключ покупателя
            </label>
            <input
              id="api-key"
              type="text"
              className="form-control"
              placeholder="00000000-0000-0000-0000-000000000001"
              value={apiKey}
              onChange={(event) => onApiKeyChange(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <div className="form-text">
              Передаётся в параметре <code>key</code>. По умолчанию берётся из <code>VITE_API_KEY</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
