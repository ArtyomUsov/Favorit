import { useSelector } from 'react-redux'
import { formatPrice } from '../lib/nomenclature'
import Loader from './Loader'
import Message from './Message'

export default function AnalogTable() {
  const { number, selectedBrand, analogues } = useSelector((state) => state.search)

  if (!selectedBrand) return null

  if (analogues.status === 'loading') {
    return <Loader label={`Ищем аналоги ${selectedBrand} по артикулу ${number.trim()}…`} />
  }

  if (analogues.status === 'failed') return <Message kind="danger">{analogues.error}</Message>

  if (analogues.status !== 'succeeded') return null

  if (analogues.rows.length === 0) {
    return <Message kind="warning">Аналоги для {selectedBrand} не найдены.</Message>
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="h6 mb-3">
          3. Аналоги и предложения{' '}
          <span className="text-secondary fw-normal">
            {number.trim()} / {selectedBrand}
          </span>
        </h2>

        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-2">
            <thead>
              <tr>
                <th scope="col">Производитель</th>
                <th scope="col">Артикул</th>
                <th scope="col">Наименование</th>
                <th scope="col" className="text-end">
                  Цена
                </th>
                <th scope="col" className="text-end">
                  Остаток
                </th>
                <th scope="col">Склад лучшей цены</th>
                <th scope="col">Возврат</th>
              </tr>
            </thead>
            <tbody>
              {analogues.rows.map((row) => (
                <tr key={row.key} className={row.isSearched ? 'table-primary' : ''}>
                  <td className="fw-semibold">
                    {row.brand}
                    {row.isSearched && (
                      <span className="badge text-bg-primary ms-2">искомая позиция</span>
                    )}
                  </td>
                  <td className="font-monospace">{row.number}</td>
                  <td>{row.name}</td>
                  <td className="text-end">{formatPrice(row.price)}</td>
                  <td className="text-end">
                    {row.stock}
                    {row.totalStock !== row.stock && (
                      <span className="text-secondary"> / {row.totalStock}</span>
                    )}
                  </td>
                  <td>
                    {row.warehouse || '—'}
                    {row.own && <span className="badge text-bg-success ms-2">свой склад</span>}
                  </td>
                  <td>{row.notRefund ? <span className="badge text-bg-danger">невозврат</span> : 'да'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-secondary small mb-0">
          Цена и остаток взяты с конкретного склада (параметр <code>warehouses</code>): по документации общее поле
          цены не используется. В скобках «остаток / всего» — остаток на складе лучшей цены и суммарный остаток по
          всем складам.
        </p>
      </div>
    </div>
  )
}
