/**
 * Scrollable legal copy with custom scrollbar + high-contrast body text.
 * Used in ConsentGate and LegalModal.
 */
export default function LegalDocumentPane({
  title,
  body,
  onBack,
  showClose = false,
  onClose,
  titleId,
  scrollClassName = '',
  className = '',
}) {
  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <div className="flex items-start justify-between gap-4 shrink-0 mb-5">
        <div className="min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="font-mono text-[10px] tracking-[0.2em] text-red-mica hover:opacity-80 mb-3 text-left touch-manipulation block"
            >
              ← Back
            </button>
          )}
          <h3
            id={titleId}
            className="font-display font-light text-xl sm:text-2xl text-gray-950 tracking-tight"
          >
            {title}
          </h3>
        </div>
        {showClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-10 h-10 flex items-center justify-center border border-gray-300/90 text-gray-700 hover:text-red-mica hover:border-red-mica/40 transition-colors touch-manipulation clip-corner-tr-sm"
            aria-label="Close"
          >
            <span className="text-lg leading-none font-light" aria-hidden>
              ×
            </span>
          </button>
        )}
      </div>
      <div
        className={`legal-scrollbar flex-1 overflow-y-auto overflow-x-hidden min-h-0 max-h-[min(65vh,480px)] sm:max-h-[min(70vh,560px)] pr-3 -mr-1 pl-0.5 border-t border-b border-gray-300/80 py-5 ${scrollClassName}`}
        tabIndex={0}
        role="region"
        aria-label={title}
      >
        <div className="font-mono text-[13px] sm:text-sm text-gray-900 leading-[1.82] whitespace-pre-wrap tracking-tight">
          {body}
        </div>
      </div>
    </div>
  )
}
