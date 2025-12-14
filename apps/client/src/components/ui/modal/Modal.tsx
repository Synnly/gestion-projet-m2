import React, { forwardRef, useImperativeHandle, useState, type ReactNode, useRef } from 'react';

// Définition de l'interface des méthodes que le parent peut appeler
export interface ModalHandle {
    showModal: (title: string, content: ReactNode, buttonText?: string) => void;
}

interface ModalProps {}

export const Modal = forwardRef<ModalHandle, ModalProps>((props, ref) => {
    // États internes pour gérer le contenu dynamique
    const [title, setTitle] = useState('');
    const [content, setContent] = useState<ReactNode>(null);
    const [buttonText, setButtonText] = useState('Fermer');

    const dialogRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
        showModal: (newTitle, newContent, newButtonText = 'Fermer') => {
            setTitle(newTitle);
            setContent(newContent);
            setButtonText(newButtonText);

            // 2. Ouvrir la modale via la référence DOM interne
            dialogRef.current?.showModal();
        },
    }));

    return (
        // Attache la référence DOM interne (dialogRef) au lieu de la ref passée par le parent
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg">{title}</h3>
                <div className="py-4">{content}</div>
            </div>
            {/* Utilise l'état interne pour le texte du bouton */}
            <form method="dialog" className="modal-backdrop">
                <button>{buttonText}</button>
            </form>
        </dialog>
    );
});
