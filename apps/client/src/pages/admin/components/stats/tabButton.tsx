interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    colorName: string;
}

export const TabButton = ({ label, isActive, onClick, colorName }: TabButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={`btn btn-outline ${colorName} ${isActive && 'btn-active'} btn-lg transition-all duration-200 shadow-sm shadow-base-300`}
        >
            {label}
        </button>
    );
};
