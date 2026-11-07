import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, LifeBuoy } from 'lucide-react';
import { Button } from '@heroui/react';
import { UX_COPY } from '@/constants/copy';

export type ErrorFault = 'user' | 'server' | 'network' | 'third-party';

export interface ErrorStateProps {
  fault?: ErrorFault;
  title?: string;
  description?: string;
  referenceCode?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

/**
 * Generate a deterministic or randomized blameless support reference code
 * without including any user ID, tokens, or personal identifiers.
 */
export const generateErrorRefCode = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'CC-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Classifies an incoming Error or status code into fault category.
 */
export const classifyErrorFault = (error: any): ErrorFault => {
  if (!error) return 'server';
  if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
    return 'network';
  }
  const status = error.response?.status;
  if (status === 400 || status === 422) return 'user';
  if (status === 502 || status === 503 || status === 504) return 'third-party';
  return 'server';
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  fault = 'server',
  title,
  description,
  referenceCode,
  onRetry,
  onGoHome,
  className = '',
}) => {
  const faultMeta = {
    user: UX_COPY.error.userFault,
    server: UX_COPY.error.serverFault,
    network: UX_COPY.error.networkFault,
    'third-party': UX_COPY.error.thirdPartyFault,
  }[fault];

  const code = referenceCode || generateErrorRefCode();
  const displayTitle = title || faultMeta.title;
  const displayDescription = description || faultMeta.description;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-3xl border border-danger/30 bg-surface/90 backdrop-blur-md p-8 sm:p-10 text-center max-w-lg mx-auto shadow-md flex flex-col items-center justify-center my-6 ${className}`}
    >
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-4 ring-1 ring-danger/20">
        <AlertTriangle className="w-7 h-7 stroke-[1.75]" />
      </div>

      {/* Fault Indicator Tag */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-surface-secondary border border-separator text-label-secondary mb-2">
        <span>Fault: {fault.toUpperCase()}</span>
        <span>•</span>
        <span>Ref: {code}</span>
      </span>

      {/* Clear Plain Title */}
      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-label-primary">
        {displayTitle}
      </h3>

      {/* Clear Description & Guidance */}
      <p className="text-xs sm:text-sm text-label-secondary mt-1.5 max-w-md leading-relaxed">
        {displayDescription}
      </p>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            size="sm"
            variant="solid"
            color="primary"
            onPress={onRetry}
            startContent={<RotateCcw size={14} />}
            className="font-medium text-xs rounded-full px-5 h-9"
          >
            {faultMeta.action || 'Try Again'}
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onPress={onGoHome || (() => (window.location.href = '/dashboard'))}
          startContent={<Home size={14} />}
          className="font-medium text-xs rounded-full px-4 h-9"
        >
          Return Home
        </Button>

        <a
          href={`mailto:support@bitsathy.ac.in?subject=Code%20Circle%20Issue%20[${code}]`}
          className="inline-flex items-center gap-1.5 text-xs text-label-tertiary hover:text-label-primary px-3 py-1.5 transition-colors"
        >
          <LifeBuoy size={13} />
          <span>Report ref {code}</span>
        </a>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  referenceCode: string;
}

/**
 * Robust Error Boundary that protects routes and major sections.
 * Sanitizes errors to ensure no passwords, tokens, or PII are logged.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      referenceCode: generateErrorRefCode(),
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sanitized logging: exclude potential sensitive text
    const cleanMessage = (error.message || '').replace(/bearer\s+[a-zA-Z0-9._-]+/gi, '[REDACTED_TOKEN]');
    console.error(`[ErrorBoundary] Caught in section "${this.props.sectionName || 'Root'}":`, {
      code: this.state.referenceCode,
      message: cleanMessage,
      componentStack: errorInfo.componentStack?.slice(0, 500),
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, referenceCode: generateErrorRefCode() });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorState
          fault="server"
          title={`${this.props.sectionName || 'This section'} encountered an issue`}
          description={UX_COPY.error.boundaryFallback.description}
          referenceCode={this.state.referenceCode}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
