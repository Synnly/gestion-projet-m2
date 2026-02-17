import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { ExportFormat, ExportStatus, type ExportListItem } from '../../../../types/exportImportDB.types';
import { createExport, listExports, cancelExport, downloadExport } from '../../../../apis/export';

export function useExportManagement(authFetch: any, isActive: boolean, pendingImportId: string | null) {
    const [exports, setExports] = useState<ExportListItem[]>([]);
    const [isLoadingExports, setIsLoadingExports] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const authFetchRef = useRef(authFetch);

    // Update authFetch ref when it changes
    useEffect(() => {
        authFetchRef.current = authFetch;
    }, [authFetch]);

    const loadExports = useCallback(async () => {
        setIsLoadingExports(true);
        try {
            const data = await listExports(authFetchRef.current);
            setExports(data);
        } catch (error) {
            console.error('Erreur lors du chargement des exports:', error);
        } finally {
            setIsLoadingExports(false);
        }
    }, []);

    useEffect(() => {
        if (isActive) {
            loadExports();
        }
    }, [isActive, loadExports]);

    // Poll exports status every 5 seconds when on export tab
    useEffect(() => {
        if (!isActive || pendingImportId) return;

        const interval = setInterval(() => {
            loadExports();
        }, 5000);

        return () => clearInterval(interval);
    }, [isActive, pendingImportId, loadExports]);

    const handleDownloadExport = async (exportId: string) => {
        setActionLoading(exportId);
        try {
            await downloadExport(authFetch, exportId);
            toast.success('Téléchargement en cours...');
        } catch (error) {
            toast.error('Erreur lors du téléchargement de l\'export');
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelExport = async (exportId: string) => {
        setActionLoading(exportId);
        try {
            await cancelExport(authFetch, exportId);
            toast.success('Export annulé avec succès');
            loadExports();
        } catch (error) {
            toast.error('Erreur lors de l\'annulation de l\'export');
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateExport = async () => {
        setIsCreating(true);
        try {
            const result = await createExport(authFetch, {
                format: ExportFormat.JSON,
            });
            if (result.message === "Export initiated. You will receive an email when the export is complete.") {
                result.message = "Export initié. Vous recevrez un email lorsque l'export sera prêt.";
            }
            toast.success(result.message);
            loadExports();
        } catch (error) {
            toast.error("Erreur lors de la création de l'export");
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const canCancel = (status: ExportStatus) => {
        return status === ExportStatus.PENDING || status === ExportStatus.IN_PROGRESS;
    };

    const canDownload = (status: ExportStatus) => {
        return status === ExportStatus.COMPLETED;
    };

    const clearExportsForImport = () => {
        setExports([]);
    };

    return {
        exports,
        isLoadingExports,
        isCreating,
        actionLoading,
        handleDownloadExport,
        handleCancelExport,
        handleCreateExport,
        loadExports,
        canCancel,
        canDownload,
        clearExportsForImport,
    };
}
