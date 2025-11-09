import { useState } from 'react';
/**
* @description confirmation modal, it has to await when used with askUserConfirmation
*/

export default function useConfirmModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [resolveCallback, setResolveCallback] = useState<(value: boolean) => void>();
    /*
    *@description show modal and init resolve function inside state, use await to make modal sync and get choice of user
    *@return the choice of user
    */
    const askUserConfirmation = () => {
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolveCallback(() => resolve);
        });
    };
    /**
    * @description confirm choice of modal and close modal
    * @returns true
    */
    const confirm = () => {
        setIsOpen(false);
        resolveCallback?.(true);
    };
    /**
    * @description cancel choice of modal and close modal
    * @returns false
    */
    const cancel = () => {
        setIsOpen(false);
        resolveCallback?.(false);
    };

    const Modal = ({message}:{message:string}) =>
        isOpen ? (
            <div
                className="fixed inset-0 flex items-center justify-center bg-black z-50"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            >
                <div className="bg-white p-6 px-10 shadow-md text-center max-w-sm rounded-xl">
                    <p className="mb-4 text-2xl font-bold">Êtes-vous sûr de vouloir continuer ?</p>
                    <p className="mb-4">
                       {message} 
                    </p>
                    <div className="flex justify-center flex-col gap-4">
                        <button onClick={confirm} className="px-4 py-2 bg-red-500 text-white rounded-2xl">
                            Confirmer
                        </button>
                        <button onClick={cancel} className="px-4 py-2 bg-gray-300 rounded-2xl">
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        ) : null;

    return { askUserConfirmation, Modal };
}
