import { Database, FileText, Loader2, AlertCircle } from 'lucide-react';
import { ExportStatus, type ExportListItem } from '../../../types/exportImportDB.types';
import ExportHistoryTable from './ExportHistoryTable';

interface ExportTabProps {
    isCreating: boolean;
    exports: ExportListItem[];
    isLoadingExports: boolean;
    actionLoading: string | null;
    onCreateExport: () => void;
    onDownloadExport: (exportId: string) => void;
    onCancelExport: (exportId: string) => void;
    onRefreshExports: () => void;
    canCancel: (status: ExportStatus) => boolean;
    canDownload: (status: ExportStatus) => boolean;
}

export default function ExportTab({
    isCreating,
    exports,
    isLoadingExports,
    actionLoading,
    onCreateExport,
    onDownloadExport,
    onCancelExport,
    onRefreshExports,
    canCancel,
    canDownload,
}: ExportTabProps) {
    return (
        <>
            <div className="card bg-base-200 shadow-xl mb-6">
                <div className="card-body">
                    <h2 className="card-title flex items-center gap-2">
                        <Database className="w-6 h-6" />
                        Créer un nouvel export
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        L'export sera effectué en arrière-plan. Vous recevrez un email lorsqu'il sera prêt.
                    </p>

                    <div className="card-actions justify-end">
                        <button className="btn btn-primary" onClick={onCreateExport} disabled={isCreating}>
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
                                    Créer l'export
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="alert alert-info mt-6">
                <AlertCircle className="w-6 h-6" />
                <div>
                    <h3 className="font-bold">À propos des exports</h3>
                    <ul className="text-sm list-disc list-inside mt-2">
                        <li>Les exports sont créés en arrière-plan et peuvent prendre plusieurs minutes</li>
                        <li>Vous recevrez un email lorsque l'export sera prêt à être téléchargé</li>
                        <li>Les exports incluent toutes les collections de la base de données</li>
                        <li>Format: JSON</li>
                    </ul>
                </div>
            </div>

            <ExportHistoryTable
                exports={exports}
                isLoadingExports={isLoadingExports}
                actionLoading={actionLoading}
                onDownload={onDownloadExport}
                onCancel={onCancelExport}
                onRefresh={onRefreshExports}
                canCancel={canCancel}
                canDownload={canDownload}
            />
        </>
    );
}
