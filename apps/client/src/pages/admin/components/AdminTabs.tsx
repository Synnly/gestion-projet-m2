import { useState } from 'react';

interface TabItem {
    id: string;
    label: string;
    content: React.ReactNode;
}

interface AdminTabsProps {
    tabs: TabItem[];
    defaultTabId?: string;
}

export function AdminTabs({ tabs, defaultTabId }: AdminTabsProps) {
    const [activeTab, setActiveTab] = useState<string>(defaultTabId || tabs[0]?.id || '');

    if (tabs.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>Aucun onglet disponible</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div role="tablist" className="tabs tabs-lift mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="bg-base-100 p-6 md:p-10 border border-base-300 rounded-lg">
                {tabs.map((tab) => (
                    <div key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
