/**
 * Single source of truth for Application Demo Mode on the frontend.
 * When ENABLE_DEMO_MODE is 'false', demo/mock data is strictly disabled across the application.
 */
let runtimeDemoMode: boolean | null = null;

export const setRuntimeDemoMode = (enabled: boolean) => {
  runtimeDemoMode = enabled;
};

export const isDemoMode = (): boolean => {
  if (runtimeDemoMode !== null) {
    return runtimeDemoMode;
  }

  // 1. Check Vite build-time / injected environment variable
  const metaEnv = (import.meta as any).env;
  if (metaEnv) {
    const viteDemo = metaEnv.VITE_ENABLE_DEMO_MODE;
    if (viteDemo === 'false' || viteDemo === false) {
      return false;
    }
    const envDemo = metaEnv.ENABLE_DEMO_MODE;
    if (envDemo === 'false' || envDemo === false) {
      return false;
    }
  }

  // 2. Check process.env if available in client runtime
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.ENABLE_DEMO_MODE === 'false' || (process.env as any).ENABLE_DEMO_MODE === false) {
      return false;
    }
  }

  return true;
};

