import { useState, forwardRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import profilPlaceholder from '../../../assets/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { IMAGE_SIZE_MAX } from '../../utils/constantes';
type ProfilePictureProps = {
    src?: string;
    overlay?: boolean;
    overlayPicture?: string;
    className?: string;
    handleModif?: (file: string) => void;
    imgRef?: React.Ref<HTMLImageElement>;
    register?: UseFormRegisterReturn;
    error?: FieldError;
};

export const ProfilePicture = forwardRef<File | null, ProfilePictureProps>(
    (
        { src, overlay = false, overlayPicture, className, handleModif, imgRef, register, error }: ProfilePictureProps,
        ref,
    ) => {
        const [srcPicture, setSrcPicture] = useState(src);

        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file && file?.size > IMAGE_SIZE_MAX) {
                //changer pour une modale
                window.alert('fichier trop volumineux');
                return;
            }

            if (!file) return;

            if (ref) {
                if (typeof ref === 'function') {
                    ref(file); // ref callback
                } else {
                    (ref as React.MutableRefObject<File | null>).current = file;
                }
            }
            const reader = new FileReader();
            reader.onload = () => {
                const url = reader.result as string;
                setSrcPicture(url);
                if (handleModif) handleModif(url);
            };
            reader.readAsDataURL(file);
        };

        useEffect(() => {
            setSrcPicture(src);
        }, [src]);

        return (
            <>
                <div className={cn('relative group rounded-full overflow-hidden w-24 h-24', className)}>
                    <label className="cursor-pointer relative flex w-full h-full">
                        <img
                            src={srcPicture || profilPlaceholder}
                            ref={imgRef}
                            className="object-cover w-full h-full"
                        />
                        <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg"
                            className="absolute inset-0 opacity-0 z-50 cursor-pointer"
                            {...register}
                            onChange={handleFileChange}
                        />
                    </label>

                    {overlay && (
                        <div
                            className="absolute inset-0 h-full w-full bg-black/40 rounded-full opacity-0 
                            group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                            <img src={overlayPicture} alt="pen" className="h-[30%] w-[30%]" />
                        </div>
                    )}
                </div>
                {error && <p className="text-sm text-red-600 mt-1">{error.message}</p>}
            </>
        );
    },
);
