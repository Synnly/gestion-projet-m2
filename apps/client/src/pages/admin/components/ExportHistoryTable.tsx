import { Loader2, Database, RefreshCw, Download, XCircle } from 'lucide-react';
import { type ExportListItem, ExportStatus } from '../../../types/exportImportDB.types';
import StatusBadge from './StatusBadge';
import { formatFileSize, formatDate } from './utils/formatters';

interface ExportHistoryTableProps {
    exports: ExportListItem[];
    isLoadingExports: boolean;
    actionLoading: string | null;
    onDownload: (exportId: string) => void;
    onCancel: (exportId: string) => void;
    onRefresh: () => void;
    canCancel: (status: ExportStatus) => boolean;
    canDownload: (status: ExportStatus) => boolean;
}

export default function ExportHistoryTable({
    exports,
    isLoadingExports,
    actionLoading,
    onDownload,
    onCancel,
    onRefresh,
    canCancel,
    canDownload,
}: ExportHistoryTableProps) {
    return (
        <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title">Historique des exports</h2>
                    <button
                        className="btn btn-ghost btn-sm gap-2"
                        onClick={onRefresh}
                        disabled={isLoadingExports}
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoadingExports ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                </div>

                {isLoadingExports && exports.length === 0 ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : exports.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Aucun export disponible</p>
                        <p className="text-sm">Créez votre premier export ci-dessus</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Date de création</th>
                                    <th>Statut</th>
                                    <th>Collections</th>
                                    <th>Documents</th>
                                    <th>Taille</th>
                                    <th>Complété le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exports.map((exp) => (
                                    <tr key={exp.exportId}>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{formatDate(exp.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge status={exp.status} />
                                        </td>
                                        <td>
                                            <span className="font-mono">{exp.collectionsCount ?? '-'}</span>
                                        </td>
                                        <td>
                                            <span className="font-mono">
                                                {exp.documentsCount?.toLocaleString() ?? '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="font-mono">{formatFileSize(exp.fileSize)}</span>
                                        </td>
                                        <td>
                                            {exp.completedAt ? (
                                                <span className="text-sm">{formatDate(exp.completedAt)}</span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {canDownload(exp.status) && (
                                                    <button
                                                        className="btn btn-success btn-sm gap-2"
                                                        onClick={() => onDownload(exp.exportId)}
                                                        disabled={actionLoading === exp.exportId}
                                                    >
                                                        {actionLoading === exp.exportId ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4" />
                                                        )}
                                                        Télécharger
                                                    </button>
                                                )}
                                                {canCancel(exp.status) && (
                                                    <button
                                                        className="btn btn-error btn-sm gap-2"
                                                        onClick={() => onCancel(exp.exportId)}
                                                        disabled={actionLoading === exp.exportId}
                                                    >
                                                        {actionLoading === exp.exportId ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4" />
                                                        )}
                                                        Annuler
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
