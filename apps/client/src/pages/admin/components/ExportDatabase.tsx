import { useState, useRef } from 'react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch';
import { Download, Upload } from 'lucide-react';
import { useExportManagement } from '../../../hooks/useExportManagement';
import { useImportManagement } from '../../../hooks/useImportManagement';
import ExportTab from './ExportTab';
import ImportTab from './ImportTab';
import WarningModal from './modals/WarningModal.tsx';

export default function ExportDatabase() {
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const authFetch = UseAuthFetch();

    // Import management hook
    const importHook = useImportManagement(authFetch, () => {
        exportHook.clearExportsForImport();
    });

    // Export management hook (needs pendingImportId from import hook)
    const exportHook = useExportManagement(authFetch, activeTab === 'export', importHook.pendingImportId);

    const handleCreateImport = () => {
        importHook.handleCreateImport(fileInputRef);
    };

    const handleConfirmImport = () => {
        importHook.setShowWarningModal(false);
        importHook.handleCreateImport(fileInputRef);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Gestion de la Base de Données</h1>

            <div className="tabs tabs-boxed mb-6 w-fit">
                <button
                    className={`tab ${activeTab === 'export' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('export')}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </button>
                <button
                    className={`tab ${activeTab === 'import' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('import')}
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                </button>
            </div>

            {activeTab === 'export' && (
                <ExportTab
                    isCreating={exportHook.isCreating}
                    exports={exportHook.exports}
                    isLoadingExports={exportHook.isLoadingExports}
                    actionLoading={exportHook.actionLoading}
                    onCreateExport={exportHook.handleCreateExport}
                    onDownloadExport={exportHook.handleDownloadExport}
                    onCancelExport={exportHook.handleCancelExport}
                    onRefreshExports={exportHook.loadExports}
                    canCancel={exportHook.canCancel}
                    canDownload={exportHook.canDownload}
                />
            )}

            {activeTab === 'import' && (
                <ImportTab
                    isCreating={importHook.isCreating}
                    selectedFile={importHook.selectedFile}
                    clearExisting={importHook.clearExisting}
                    pendingImportId={importHook.pendingImportId}
                    importStatusMessage={importHook.importStatusMessage}
                    onFileChange={importHook.handleFileChange}
                    onClearExistingChange={importHook.setClearExisting}
                    onCreateImport={handleCreateImport}
                />
            )}

            <WarningModal
                isOpen={importHook.showWarningModal}
                onCancel={importHook.closeWarningModal}
                onConfirm={handleConfirmImport}
            />
        </div>
    );
}
