import { useDispatch, useSelector } from 'react-redux'
import { brandSelected, fetchAnalogues } from '../store/searchSlice'
import Loader from './Loader'
import Message from './Message'

export default function BrandList({ apiKey }) {
  const dispatch = useDispatch()
  const { number, brands, selectedBrand } = useSelector((state) => state.search)

  if (brands.status === 'loading') return <Loader label="Ищем производителей по артикулу…" />

  if (brands.status === 'failed') return <Message kind="danger">{brands.error}</Message>

  if (brands.status !== 'succeeded') return null

  if (brands.items.length === 0) {
    return <Message kind="warning">Деталь с артикулом «{number.trim()}» не найдена в базе сервиса.</Message>
  }

  const handleSelect = (brand) => {
    dispatch(brandSelected(brand))
    dispatch(fetchAnalogues({ key: apiKey.trim(), number: number.trim(), brand }))
  }

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h2 className="h6 mb-3">
          2. Выберите производителя <span className="text-secondary fw-normal">({brands.items.length})</span>
        </h2>
        <div className="list-group">
          {brands.items.map((item) => (
            <button
              key={item.brand}
              type="button"
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                selectedBrand === item.brand ? 'active' : ''
              }`}
              onClick={() => handleSelect(item.brand)}
            >
              <span className="fw-semibold">{item.brand}</span>
              <span className="text-secondary small">
                позиций: {item.positions}, остаток: {item.stock}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
