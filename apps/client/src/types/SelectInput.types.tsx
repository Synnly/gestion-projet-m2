export interface SelectInputProps {
    options: string[];
    label: string;
    /** Controlled value for the select (optional) */
    value?: string;
    /** Called when the select value changes */
    onChange?: (value: string) => void;
}
