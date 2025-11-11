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
});
