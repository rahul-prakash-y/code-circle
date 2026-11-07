/**
 * Code Circle — Unified Microcopy & UX State Copy System
 * Plain, blameless, specific microcopy for all 10 user-facing states.
 * Centralized for localization, accessibility review, and design consistency.
 */

export const UX_COPY = {
  empty: {
    firstUse: {
      title: 'Nothing here yet',
      description: 'Get started by creating your first record or exploring the directory.',
      action: 'Create New',
    },
    filtered: {
      title: 'No items match your active filters',
      description: 'You have applied one or more filters that narrowed down all results. Try loosening your filters to see more.',
      action: 'Reset All Filters',
    },
    noMatch: {
      title: 'No results found',
      description: 'We couldn’t find any matches for your request.',
      action: 'Clear Search',
    },
    noPermission: {
      title: 'No access to these records',
      description: 'This section is reserved for specific member roles or faculty administrators.',
      action: 'Go to Dashboard',
    },
    failedToLoad: {
      title: 'Unable to load content',
      description: 'Our server could not provide the requested records right now.',
      action: 'Try Again',
    },
  },

  loading: {
    initial: 'Loading content...',
    refreshing: 'Updating in the background...',
    skeletonLabel: 'Loading layout placeholder',
  },

  error: {
    genericTitle: 'Something went wrong',
    userFault: {
      title: 'Check your input details',
      description: 'A required field or formatted value was invalid or missing. Please correct the highlighted entries and submit again.',
      action: 'Edit Input',
    },
    serverFault: {
      title: 'Our server encountered an issue',
      description: 'The server could not complete this operation. Our team has been notified. Please try again shortly.',
      action: 'Retry Request',
    },
    networkFault: {
      title: 'Connection interrupted',
      description: 'Your request could not reach our servers. Check your internet connection or Wi-Fi status.',
      action: 'Check Connection & Retry',
    },
    thirdPartyFault: {
      title: 'External service unavailable',
      description: 'A third-party dependency (e.g. Code Execution Engine, Cloudinary, or Firebase) is taking longer to respond.',
      action: 'Retry External Service',
    },
    boundaryFallback: {
      title: 'Section encountered an unexpected error',
      description: 'This part of the application encountered a problem and had to pause. The rest of the platform remains active.',
      action: 'Reload Section',
    },
  },

  offline: {
    banner: 'You are currently working offline. You can still review cached content and type responses; mutations will sync once connection returns.',
    badge: 'Offline Mode',
    syncedNotice: 'Internet restored! Your changes and telemetry have synced safely.',
    actionDisabledTooltip: 'This action requires an active network connection.',
  },

  slowNetwork: {
    takingLonger: 'Taking longer than usual...',
    explanation: 'The network connection is slow. Please hang tight or cancel to save data.',
    retryAction: 'Keep Waiting',
    cancelAction: 'Cancel Request',
    dataSaverNotice: 'Data-saver mode active. High-bandwidth assets are deferred.',
  },

  noSearch: {
    title: (query: string) => `No matches found for "${query}"`,
    suggestion: 'Try checking for typos, using broader keywords, or clearing active filters.',
    didYouMean: (term: string) => `Showing 0 results. Did you mean "${term}"?`,
    clearAction: 'Clear Search & Filters',
  },

  permission: {
    browser: {
      camera: {
        title: 'Camera access required for assessment proctoring',
        description: 'To maintain academic integrity during monitored assessments, camera verification is needed. Your video stream is analyzed locally for tab switching and presence.',
        howToEnable: 'Click the camera/lock icon in your browser URL bar and allow Camera permission, then refresh.',
      },
      notifications: {
        title: 'Enable exam and contest alerts',
        description: 'Get notified 10 minutes before weekly contests and scheduled workshop hackathons begin.',
        howToEnable: 'Allow notifications in your browser permission bar.',
      },
    },
    appForbidden: {
      title: 'Access restricted (403)',
      description: 'Your account does not have permission to view or manage this administrative resource.',
      action: 'Return to Dashboard',
    },
  },

  session: {
    expiredTitle: 'Session expired',
    expiredDescription: 'Your security token has expired. Your current work and inputs have been preserved locally. Sign in again to continue right where you left off.',
    loginAction: 'Sign In to Restore Session',
    workPreservedBadge: 'Drafts preserved in local storage',
    warnTitle: 'Session expiring soon',
    warnDescription: 'Your login session will end in 5 minutes. Click below to extend without interrupting your work.',
    extendAction: 'Keep Me Signed In',
  },

  validation: {
    requiredField: 'This field is required.',
    invalidEmail: 'Please enter a valid email address (e.g. name@bitsathy.ac.in).',
    passwordTooShort: 'Password must be at least 8 characters long.',
    rollNoFormat: 'Roll number must match your student ID format.',
    formHasErrors: 'Please review and fix the highlighted fields above before proceeding.',
  },

  success: {
    saved: 'Changes saved successfully.',
    created: 'Record created successfully.',
    submitted: 'Your response has been submitted and recorded.',
    actionNext: 'What would you like to do next?',
    undo: 'Undo',
  },
} as const;
