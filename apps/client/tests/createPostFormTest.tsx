import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CreatePostForm } from "../src/components/posts/CreatePostForm";
import { profileStore } from "../src/store/profileStore";
import { useCreatePostStore } from "../src/store/CreatePostStore";

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
}));

const originalCreatePostState = useCreatePostStore.getState();

describe("CreatePostForm", () => {
  const mutateMock = vi.fn();
  const alertMock = vi.fn();

  beforeEach(() => {
    (useMutation as unknown as vi.Mock).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });
    global.alert = alertMock;
    profileStore.setState({ profile: null });
    useCreatePostStore.setState({ ...originalCreatePostState });
    mutateMock.mockClear();
    alertMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("affiche une alerte si l'id entreprise est manquant et ne déclenche pas la mutation", async () => {
    const { container } = render(
      <MemoryRouter>
        <CreatePostForm />
      </MemoryRouter>
    );

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        "Impossible de créer l'annonce : identifiant entreprise manquant."
      );
      expect(mutateMock).not.toHaveBeenCalled();
    });
  });

  it("mappe correctement le payload et déclenche la mutation quand le profil est présent", async () => {
    profileStore.setState({
      profile: {
        _id: "company123",
        name: "TestCo",
        email: "test@example.com",
        nafCode: undefined,
        structureType: undefined,
        isValid: true,
        isVerified: true,
      },
    });

    useCreatePostStore.setState((state) => ({
      ...state,
      title: "Stage Dev",
      description: "Desc",
      addressLine: "10 rue de Rivoli",
      city: "Paris",
      postalCode: "75001",
      duration: "6 mois",
      sector: "Tech",
      startDate: "2025-01-01",
      minSalary: "1000",
      maxSalary: "2000",
      workMode: "teletravail",
      skills: ["JS", "React"],
      isVisibleToStudents: true,
    }));

    const { container } = render(
      <MemoryRouter>
        <CreatePostForm />
      </MemoryRouter>
    );

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
      expect(mutateMock).toHaveBeenCalledWith({
        companyId: "company123",
        data: {
          title: "Stage Dev",
          description: "Desc",
          duration: "6 mois",
          sector: "Tech",
          startDate: "2025-01-01",
          minSalary: 1000,
          maxSalary: 2000,
          keySkills: ["JS", "React"],
          adress: "10 rue de Rivoli, 75001, Paris",
          type: "Télétravail",
          isVisible: true,
        },
      });
    });
  });
});


