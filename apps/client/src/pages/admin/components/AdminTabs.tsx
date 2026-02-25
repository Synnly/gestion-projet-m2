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
            <div className="tabs tabs-lift">
                {tabs.map((tab) => (
                    <>
                        <label className="tab" key={tab.id}>
                            <input
                                type="radio"
                                name={tab.label}
                                className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                                checked={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            />
                            {tab.label}
                        </label>
                        <div className="tab-content bg-base-100 border-base-300 p-6">{tab.content}</div>
                    </>
                ))}
            </div>
            {/*<div className="bg-base-100 p-6 md:p-10 rounded-lg">*/}
            {/*    {tabs.map((tab) => (*/}
            {/*    ))}*/}
            {/*</div>*/}
        </div>
    );
}
