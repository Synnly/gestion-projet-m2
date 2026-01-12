interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    colorName: string; // ex: 'blue', 'purple', 'emerald'
}

export const TabButton = ({ label, isActive, onClick, colorName }: TabButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-sm
                ${isActive
                    ? `bg-${colorName}-600 text-white scale-105 shadow-md ring-2 ring-${colorName}-600 ring-offset-2`
                    : 'bg-base-100 text-base-content hover:bg-base-200 border border-base-300'
                }
            `}
        >
            {label}
        </button>
    );
};