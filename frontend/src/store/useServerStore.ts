/// <reference types="vite/client" />
import { create } from 'zustand';

export interface ServerStoreState {
  activeServerUrl: string | null;
  isConnecting: boolean;
  serverNodes: string[];
  latencyMs: number | null;
  findFastestServer: () => Promise<string>;
  setActiveServerUrl: (url: string) => void;
  clearActiveServer: () => void;
}

// Default Render Backend Clusters (Free Tier instances distributed for horizontal load distribution)
export const DEFAULT_BACKEND_NODES: string[] = [
  'https://code-circle-backend-1.onrender.com',
  'https://code-circle-backend-2.onrender.com',
  'https://code-circle-backend-3.onrender.com',
];

// Allow runtime or environment override via comma-separated string
const getAvailableNodes = (): string[] => {
  const envServers = import.meta.env.VITE_BACKEND_SERVERS;
  if (typeof envServers === 'string' && envServers.trim().length > 0) {
    return envServers.split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
  }
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '')
    : null;
  if (import.meta.env.DEV) {
    return [envBaseUrl || 'http://localhost:5000', ...DEFAULT_BACKEND_NODES];
  }
  if (envBaseUrl) {
    return [envBaseUrl, ...DEFAULT_BACKEND_NODES];
  }
  return DEFAULT_BACKEND_NODES;
};

const LOCAL_STORAGE_KEY = 'activeServerUrl';

// In-flight singleton promise to prevent duplicate probing during concurrent API bootstrap
let inFlightProbePromise: Promise<string> | null = null;

export const useServerStore = create<ServerStoreState>((set, get) => {
  // Read persisted server on startup to keep student pinned to the same backend node
  const initialSavedUrl =
    typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_STORAGE_KEY) : null;

  return {
    activeServerUrl: initialSavedUrl || null,
    isConnecting: false,
    serverNodes: getAvailableNodes(),
    latencyMs: null,

    /**
     * Probes all 3 Render backend servers concurrently using Promise.any().
     * The first node to return a successful 200 OK wins the race.
     * The winning server is saved in Zustand state and localStorage to prevent session fragmentation.
     */
    findFastestServer: async (): Promise<string> => {
      // 1. If we already have an active server pinned and verified, return it
      const existing = get().activeServerUrl;
      if (existing && !get().isConnecting) {
        return existing;
      }

      // 2. If a probe is already underway, coalesce into the same promise
      if (inFlightProbePromise) {
        return inFlightProbePromise;
      }

      set({ isConnecting: true });

      inFlightProbePromise = (async () => {
        const nodes = get().serverNodes;
        const startTime = Date.now();

        // Helper probe sending lightweight GET /api/health with timeout
        const probeNode = async (nodeUrl: string): Promise<string> => {
          const cleanUrl = nodeUrl.replace(/\/+$/, '');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

          try {
            const response = await fetch(`${cleanUrl}/api/health`, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                Accept: 'application/json',
              },
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              return cleanUrl;
            }
            throw new Error(`Server ${cleanUrl} returned non-200 HTTP ${response.status}`);
          } catch (err: any) {
            clearTimeout(timeoutId);
            throw new Error(`Probe failed for node ${cleanUrl}: ${err.message || 'Network error'}`);
          }
        };

        try {
          // Race all candidate servers simultaneously: first 200 OK wins
          const winningUrl = await Promise.any(nodes.map((url) => probeNode(url)));
          const latency = Date.now() - startTime;

          // Pin winning URL in Zustand state and localStorage
          set({
            activeServerUrl: winningUrl,
            isConnecting: false,
            latencyMs: latency,
          });

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, winningUrl);
          }

          console.log(
            `[Client Load Balancer] Selected optimal node: ${winningUrl} (RTT: ${latency}ms)`
          );
          return winningUrl;
        } catch (aggregateErr: any) {
          // Resilient Fallback: If all remote Render nodes fail (e.g. offline or local dev)
          console.warn(
            '[Client Load Balancer] All remote backend nodes failed probe. Falling back to default URL.',
            aggregateErr
          );

          const fallbackUrl =
            (import.meta.env.VITE_API_BASE_URL
              ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
              : null) || 'http://localhost:5000';

          const cleanFallback = fallbackUrl.replace(/\/+$/, '');

          set({
            activeServerUrl: cleanFallback,
            isConnecting: false,
            latencyMs: null,
          });

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, cleanFallback);
          }

          return cleanFallback;
        } finally {
          inFlightProbePromise = null;
        }
      })();

      return inFlightProbePromise;
    },

    setActiveServerUrl: (url: string) => {
      const clean = url.replace(/\/+$/, '');
      set({ activeServerUrl: clean });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, clean);
      }
    },

    clearActiveServer: () => {
      set({ activeServerUrl: null, latencyMs: null });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    },
  };
});

export default useServerStore;
