export default function Message({ kind = 'info', children }) {
  if (!children) return null
  return (
    <div className={`alert alert-${kind} py-2 my-2`} role="alert">
      {children}
    </div>
  )
}
