// src/__tests__/pages/Register.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '@/pages/Register';
import * as utils from '@/lib/utils';
import * as auth from '@/lib/auth';

vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    fetchData: vi.fn(),
    mainUrl: 'http://localhost:3000',
  };
});

vi.mock('@/lib/auth', () => ({
  setAccessToken: vi.fn(),
}));

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );
  };

  it("devrait afficher le formulaire d'inscription", () => {
    renderRegister();

    expect(screen.getByText('Inscription')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Votre nom')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Minimum 6 caractères')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "S'inscrire" })).toBeInTheDocument();
  });

  it('devrait mettre à jour tous les champs du formulaire', () => {
    renderRegister();

    const nameInput = screen.getByPlaceholderText('Votre nom') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('email@example.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Minimum 6 caractères') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.change(emailInput, { target: { value: 'alice@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(nameInput.value).toBe('Alice');
    expect(emailInput.value).toBe('alice@test.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('devrait soumettre le formulaire avec succès', async () => {
    const mockResponse = {
      data: { accessToken: 'fake-token' },
      error: null,
    };

    vi.mocked(utils.fetchData).mockResolvedValue(mockResponse);

    renderRegister();

    const nameInput = screen.getByPlaceholderText('Votre nom');
    const emailInput = screen.getByPlaceholderText('email@example.com');
    const passwordInput = screen.getByPlaceholderText('Minimum 6 caractères');
    const submitButton = screen.getByRole('button', { name: "S'inscrire" });

    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.change(emailInput, { target: { value: 'alice@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(auth.setAccessToken).toHaveBeenCalledWith('fake-token');
      expect(window.location.href).toBe('/');
    });
  });

  it("devrait afficher une erreur en cas d'échec", async () => {
    const mockResponse = {
      data: null,
      error: { name: 'test', message: 'Cet email est déjà utilisé' },
    };

    vi.mocked(utils.fetchData).mockResolvedValue(mockResponse);

    renderRegister();

    const submitButton = screen.getByRole('button', { name: "S'inscrire" });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Cet email est déjà utilisé')).toBeInTheDocument();
    });
  });

  it('devrait afficher le bouton de chargement', async () => {
    vi.mocked(utils.fetchData).mockImplementation(() => new Promise(() => {}));

    renderRegister();

    const nameInput = screen.getByPlaceholderText('Votre nom');
    const emailInput = screen.getByPlaceholderText('email@example.com');
    const passwordInput = screen.getByPlaceholderText('Minimum 6 caractères');
    const submitButton = screen.getByRole('button', { name: "S'inscrire" });

    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.change(emailInput, { target: { value: 'alice@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Inscription...' })).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('devrait valider la longueur minimale du mot de passe', () => {
    renderRegister();

    const passwordInput = screen.getByPlaceholderText('Minimum 6 caractères');
    expect(passwordInput).toHaveAttribute('minLength', '6');
  });

  it("devrait valider le format de l'email", () => {
    renderRegister();

    const emailInput = screen.getByPlaceholderText('email@example.com');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('devrait afficher le lien de connexion', () => {
    renderRegister();

    const loginLink = screen.getByText('Se connecter');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('devrait empêcher la soumission avec des champs requis vides', () => {
    renderRegister();

    const nameInput = screen.getByPlaceholderText('Votre nom');
    const emailInput = screen.getByPlaceholderText('email@example.com');
    const passwordInput = screen.getByPlaceholderText('Minimum 6 caractères');

    expect(nameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });

  it("devrait gérer le cas où aucun token n'est retourné", async () => {
    const mockResponse = {
      data: { accessToken: null },
      error: null,
    };

    vi.mocked(utils.fetchData).mockResolvedValue(mockResponse);

    renderRegister();

    const submitButton = screen.getByRole('button', { name: "S'inscrire" });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('No token returned')).toBeInTheDocument();
    });
  });
});
