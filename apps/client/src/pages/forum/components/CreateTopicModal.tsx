import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';

import { createTopicSchema, type CreateTopicForm, type CreateTopicModalProps } from '../types';
import { createTopic } from '../../../api/create_topic';
import { FormInput } from '../../../components/form/FormInput';
import { FormSubmit } from '../../../components/form/FormSubmit';
import { CustomForm } from '../../../components/form/CustomForm';
import { Cross } from 'lucide-react';

export function CreateTopicModal({ forumId, authorId, isOpen, onClose }: CreateTopicModalProps) {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateTopicForm>({
        resolver: zodResolver(createTopicSchema) as Resolver<CreateTopicForm>,
        mode: 'onSubmit',
        defaultValues: {
            forumId,
            author: authorId,
            title: '',
            description: '',
        },
    });

    const { mutateAsync, isPending, isError, error } = useMutation({
        mutationFn: createTopic,
        onSuccess: () => {
            toast.success('Topic créé avec succès');
            queryClient.invalidateQueries({ queryKey: ['topics', forumId] });
            reset();
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la création du topic');
        },
    });

    const onSubmit: SubmitHandler<CreateTopicForm> = async (data) => {
        await mutateAsync({
            forumId,
            data: {
                title: data.title,
                description: data.description,
                author: data.author,
                forumId: data.forumId,
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <dialog open={isOpen} className="modal">
            <div className="modal-box max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl">Créer un nouveau sujet</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn btn-circle btn-ghost"
                        disabled={isPending}
                    >
                        <Cross size={16} />
                    </button>
                </div>

                <CustomForm onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormInput<CreateTopicForm>
                        label="Titre du sujet"
                        register={register('title')}
                        error={errors.title}
                        placeholder="Entrez le titre du sujet"
                        disabled={isPending}
                        className="w-full"
                    />

                    <div className="flex flex-col w-full">
                        <label className="font-bold text-sm pb-2 uppercase" htmlFor="description">
                            Description (optionnel)
                        </label>
                        <textarea
                            {...register('description')}
                            placeholder="Décrivez le sujet de discussion..."
                            disabled={isPending}
                            rows={6}
                            className="textarea textarea-bordered w-full resize-vertical"
                        />
                        {errors.description && (
                            <span className="text-error-content mt-1 bg-error p-3">
                                {errors.description.message &&
                                    errors.description.message.charAt(0).toUpperCase() +
                                        errors.description.message.slice(1)}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button type="button" onClick={handleClose} className="btn btn-ghost" disabled={isPending}>
                            Annuler
                        </button>
                        <FormSubmit
                            isPending={isPending}
                            isError={isError}
                            error={error}
                            title="Créer le sujet"
                            pendingTitle="Création..."
                            className="btn-primary"
                        />
                    </div>
                </CustomForm>
            </div>

            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose} disabled={isPending}>
                    Fermer
                </button>
            </form>
        </dialog>
    );
}
