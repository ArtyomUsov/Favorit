export default function Loader({ label }) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-3" role="status" aria-live="polite">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
