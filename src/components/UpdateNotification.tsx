import { invoke } from '@tauri-apps/api';
import { useMemo } from 'react';
import type { UpdateInfo } from '../hooks/useUpdateChecker';

interface UpdateNotificationProps {
  hasUpdate: boolean;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  dismissUpdate: () => void;
}

export default function UpdateNotification({
  hasUpdate,
  updateInfo,
  isChecking,
  dismissUpdate,
}: UpdateNotificationProps) {
  const downloadUrl = useMemo(() => updateInfo?.download_url ?? '', [updateInfo]);

  if (!hasUpdate || !updateInfo) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Nueva versión {updateInfo.latest_version} disponible
            </p>
            {updateInfo.release_notes ? (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {updateInfo.release_notes}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                try {
                  await invoke('download_and_run_update', {
                    download_url: downloadUrl,
                    latest_version: updateInfo.latest_version,
                  });
                } catch {
                  // Ignorar silenciosamente
                }
              }}
              disabled={isChecking || !downloadUrl}
              className="px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              Actualizar ahora
            </button>
            <button
              type="button"
              onClick={dismissUpdate}
              className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

