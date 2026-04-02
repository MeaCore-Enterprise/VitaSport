import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { getVersion } from '@tauri-apps/api/app';
import { APP_VERSION } from '../version';

export type UpdateInfo = {
  has_update: boolean;
  latest_version: string;
  download_url: string;
  release_notes: string;
};

const isTauriEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { __TAURI__?: unknown; __TAURI_IPC__?: unknown };
  return Boolean(win.__TAURI__ || win.__TAURI_IPC__);
};

/**
 * Hook para comprobar actualizaciones UNA VEZ al montar la app.
 * Maneja errores silenciosamente para no romper la UI si no hay internet/GitHub.
 */
export function useUpdateChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const hasUpdate = useMemo(() => {
    return Boolean(updateInfo?.has_update && !dismissed);
  }, [updateInfo, dismissed]);

  useEffect(() => {
    if (!isTauriEnvironment()) return;

    let cancelled = false;
    setIsChecking(true);

    (async () => {
      // Versión real del binario (= package.version de tauri.conf al compilar).
      let installedVersion = APP_VERSION;
      try {
        installedVersion = await getVersion();
      } catch {
        // Si falla, se usa APP_VERSION como respaldo.
      }

      try {
        const res = await invoke<UpdateInfo>('check_for_updates', {
          current_version: installedVersion,
        });
        if (cancelled) return;
        // Solo has_update true si en Rust tag_name de GitHub > versión instalada (semver).
        if (!res?.has_update) return;
        setUpdateInfo(res);
      } catch {
        // Ignorar silenciosamente (sin crashear ni mostrar UI)
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dismissUpdate = () => {
    setDismissed(true);
  };

  return { hasUpdate, updateInfo, isChecking, dismissUpdate };
}

