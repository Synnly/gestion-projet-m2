import { Mock, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useMutation } from '@tanstack/react-query';
import { userStore } from '../src/store/userStore';
import { SignupForm } from '../src/auth/companySignup/component/signupForm';
vi.mock('@tanstack/react-query', () => ({
    useMutation: vi.fn(),
}));
vi.mock('../store/userStore', () => ({
    userStore: vi.fn(),
}));

describe('Test of FormSignupComponent', () => {
    const mutateAsyncMock = vi.fn();
    const setMock = vi.fn();
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

    it('should display error when email is not correct', async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test' },
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

        fireEvent.submit(form);
        await waitFor(() => {
            expect(screen.getByText(/Email invalide/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display error when email is not correct', async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: '' },
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

        fireEvent.submit(form);
        await waitFor(() => {
            expect(screen.getByText(/L'email est requis/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display error when password is too short', async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@test.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: '1' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: '1' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.submit(form);
        await waitFor(() => {
            expect(screen.getByText(/le mot de passe doit contenir au moins 8 caractères/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display error when password is too short', async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@test.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: '1' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: '1' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.submit(form);
        await waitFor(() => {
            expect(screen.getByText(/le mot de passe doit contenir au moins 8 caractères/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display error when password is not contain lowercases', async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@test.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'PASS123!' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'PASS123!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.submit(form);
        await waitFor(() => {
            expect(screen.getByText(/le mot de passe doit contenir au moins une lettre minuscule/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display error when password is not contain uppercases', async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@test.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.submit(form);
        await waitFor(() => {
            expect(screen.getByText(/le mot de passe doit contenir au moins une lettre majuscule/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display error when password is not contain special caracters', async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@test.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'pass123' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'pass123' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.submit(form);
        await waitFor(() => {
            expect(screen.getByText(/le mot de passe doit contenir au moins un caractère spécial/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display error when password is not contain special caracters', async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@test.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass123' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.submit(form);
        await waitFor(() => {
            expect(screen.getByText(/le mot de passe doit contenir au moins un caractère spécial/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it("should display error when passwords don't match", async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');

        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@test.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass1234!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'MaBoite' },
        });

        fireEvent.submit(form);
        await waitFor(() => {
            expect(screen.getByText(/passe doit contenir au moins un caractère spécial/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should display error when name is empty', async () => {
        render(<SignupForm />);
        const form = screen.getByRole('form');
        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@test.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass1234!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: "L'email est requis" },
        });

        fireEvent.submit(form);
        await waitFor(async () => {
            const error = await screen.findByText(/L'email est requis/i);
            expect(error).toBeInTheDocument();
            expect(screen.getByText(/L'email est requis/i)).toBeInTheDocument();
            expect(mutateAsyncMock).not.toHaveBeenCalled();
            expect(setMock).not.toHaveBeenCalled();
        });
    });

    it('should mutateAsync got always good object if all is valid', async () => {
        const signUpData = {
            mail: 'test@test.com',
            password: 'Pass123!',
            name: 'Maboite',
            role: 'COMPANY',
        };
        const loginData = {
            mail: 'test@test.com',
            password: 'Pass123!',
        };
        render(<SignupForm />);
        const form = screen.getByRole('form');
        fireEvent.change(screen.getByLabelText(/email*/i), {
            target: { value: 'test@test.com' },
        });

        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
            target: { value: 'Pass123!' },
        });

        fireEvent.change(screen.getByLabelText(/nom de l'entreprise/i), {
            target: { value: 'Maboite' },
        });

        fireEvent.submit(form);

        await waitFor(() => {
            expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
            expect(setMock).toHaveBeenCalled();
            expect(mutateAsyncMock.mock.calls[0][0]).toEqual(signUpData);
            expect(mutateAsyncMock.mock.calls[1][0]).toEqual(loginData);
        });
    });
});
