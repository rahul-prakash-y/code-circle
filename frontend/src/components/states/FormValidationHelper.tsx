import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export interface FormErrorSummaryProps {
  errors: Record<string, string | undefined>;
  title?: string;
  className?: string;
}

/**
 * Error Summary Component for long forms:
 * Renders an accessible list at the top of the form with anchor links to the invalid fields.
 */
export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  title = 'Please correct the following fields before submitting:',
  className = '',
}) => {
  const activeErrors = Object.entries(errors).filter(([_, msg]) => Boolean(msg));

  if (activeErrors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border border-danger/40 bg-danger/10 p-4 text-xs text-danger space-y-2 ${className}`}
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle size={15} className="shrink-0" />
        <span>{title}</span>
      </div>
      <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-danger/90">
        {activeErrors.map(([field, msg]) => (
          <li key={field}>
            <strong className="capitalize">{field.replace(/([A-Z])/g, ' $1')}:</strong> {msg}
          </li>
        ))}
      </ul>
    </div>
  );
};

export interface FieldInlineErrorProps {
  error?: string;
  id?: string;
  className?: string;
}

/**
 * Inline field error with proper accessibility tags
 */
export const FieldInlineError: React.FC<FieldInlineErrorProps> = ({
  error,
  id,
  className = '',
}) => {
  if (!error) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={`text-[11px] font-medium text-danger flex items-center gap-1.5 mt-1 animate-in fade-in ${className}`}
    >
      <AlertCircle size={12} className="shrink-0" />
      <span>{error}</span>
    </p>
  );
};

export interface RequiredFieldMarkerProps {
  className?: string;
}

export const RequiredFieldMarker: React.FC<RequiredFieldMarkerProps> = ({ className = '' }) => (
  <span className={`text-danger ml-0.5 font-bold ${className}`} aria-hidden="true">
    *
  </span>
);

/**
 * Focuses the first input element marked as aria-invalid="true" on submit.
 */
export const focusFirstInvalidField = (formElement?: HTMLFormElement | null) => {
  if (typeof document === 'undefined') return;
  const targetForm = formElement || document.querySelector('form');
  if (!targetForm) return;

  const firstInvalid = targetForm.querySelector<HTMLElement>(
    '[aria-invalid="true"], input:invalid, select:invalid, textarea:invalid'
  );
  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
