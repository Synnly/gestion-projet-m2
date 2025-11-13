import { Mock, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useMutation } from '@tanstack/react-query';
import { userStore } from '../src/store/userStore';
import { SignupForm } from '../src/authCompany/companySignup/component/signupForm';
vi.mock('@tanstack/react-query', () => ({
    useMutation: vi.fn(),
}));
vi.mock('../store/userStore', () => ({
    userStore: vi.fn(),
}));

describe('Test of FormSignupComponent', () => {
    const mutateAsyncMock = vi.fn();
    const setMock = vi.fn();
    const askUserConfirmationMock = vi.fn();
    beforeEach(() => {
        (useMutation as Mock).mockReturnValue({
            mutateAsync: mutateAsyncMock,
            isPending: false,
            isError: false,
            error: null,
            reset: vi.fn(),
        });
        (userStore as unknown as Mock).mockReturnValue({
            set: setMock,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should display error when all required fields are not filled ', async () => {
        render(<SignupForm askUserConfirmation={askUserConfirmationMock} />);
        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getAllByText(/obligatoire|invalide/i).length).toBeGreaterThan(0);
        });
        expect(mutateAsyncMock).not.toHaveBeenCalled();
        expect(setMock).not.toHaveBeenCalled();
        expect(askUserConfirmationMock).not.toHaveBeenCalled();
    });

    it('should display modal when all required fields are filled but something is missing and data is send if user confirm', async () => {
        askUserConfirmationMock.mockResolvedValue(true);
        mutateAsyncMock.mockResolvedValue({ id: 42 });
        render(<SignupForm askUserConfirmation={askUserConfirmationMock} />);

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@mail.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.submit(screen.getByRole('form'));

        await waitFor(() => {
            expect(askUserConfirmationMock).toHaveBeenCalled();
            expect(mutateAsyncMock).toHaveBeenCalled();
            expect(setMock).toHaveBeenCalledWith(42);
        });
    });

    it('should display modal when all required fields are filled but something is missing and data is not send if user cancel', async () => {
        askUserConfirmationMock.mockResolvedValue(false);
        mutateAsyncMock.mockResolvedValue({ id: 42 });
        render(<SignupForm askUserConfirmation={askUserConfirmationMock} />);

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@mail.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.submit(screen.getByRole('form'));

        await waitFor(() => {
            expect(askUserConfirmationMock).toHaveBeenCalled();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalledWith(42);
        });
    });

    it('should display errors when password is not strong enough', async () => {
        render(<SignupForm askUserConfirmation={askUserConfirmationMock} />);
        const form = screen.getByRole('form');
        fireEvent.submit(form);

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@mail.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: '12345678' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: '12345678' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise*/i), {
            target: { value: 'MaBoite' },
        });

        await waitFor(() => {
            expect(screen.getByText(/mot de passe doit contenir/i)).toBeGreaterThan(0);
            expect(askUserConfirmationMock).not.toHaveBeenCalled();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display error when passwords do not match', async () => {
        render(<SignupForm askUserConfirmation={askUserConfirmationMock} />);
        const form = screen.getByRole('form');
        fireEvent.submit(form);

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@mail.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass1234!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        await waitFor(() => {
            expect(screen.getByText(/Les mots de passe ne correspondent pas/i)).toBeGreaterThan(0);
            expect(askUserConfirmationMock).not.toHaveBeenCalled();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display when error if siretNumber is not a number', async () => {
        render(<SignupForm askUserConfirmation={askUserConfirmationMock} />);
        const form = screen.getByRole('form');
        fireEvent.submit(form);

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@mail.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.change(screen.getByLabelText('Numérot SIRET (14 chiffres)'), {
            target: { value: 'abcdefghijklmn' },
        });
        await waitFor(() => {
            expect(screen.getByText(/Le numéro siret doit être un nombre/i)).toBeGreaterThan(0);
            expect(askUserConfirmationMock).not.toHaveBeenCalled();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });
    it('should display when error if siretNumber has not length of 14', async () => {
        render(<SignupForm askUserConfirmation={askUserConfirmationMock} />);
        const form = screen.getByRole('form');
        fireEvent.submit(form);

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@mail.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.change(screen.getByLabelText(/Numérot SIRET/i), {
            target: { value: '123456789101112' },
        });
        await waitFor(() => {
            expect(
                screen.getByText(/le siret n'est pas au bon format, il doit être un nombre de 14 caractères/i),
            ).toBeGreaterThan(0);
            expect(askUserConfirmationMock).not.toHaveBeenCalled();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display when error streetNumber is invalide', async () => {
        render(<SignupForm askUserConfirmation={askUserConfirmationMock} />);
        const form = screen.getByRole('form');
        fireEvent.submit(form);

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@mail.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.change(screen.getByLabelText(/numéro de rue/), {
            target: { value: '12@@' },
        });
        await waitFor(() => {
            expect(screen.getByText(/Le numéro de rue doit être un nombre/i)).toBeGreaterThan(0);
            expect(askUserConfirmationMock).not.toHaveBeenCalled();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });
});
