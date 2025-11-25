import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CreatePostForm } from "../src/components/posts/CreatePostForm";
import { profileStore } from "../src/store/profileStore";
import { useCreatePostStore } from "../src/store/CreatePostStore";
import { updatePostLoader } from "../src/loaders/updatePostLoader";
import { userStore } from "../src/store/userStore";

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
}));

const originalCreatePostState = useCreatePostStore.getState();

describe("UpdatePost (form + loader)", () => {
  const mutateMock = vi.fn();

  beforeEach(() => {
    (useMutation as unknown as vi.Mock).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });
    profileStore.setState({ profile: null });
    useCreatePostStore.setState({ ...originalCreatePostState });
    mutateMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("soumet les bonnes données en mode édition", async () => {
    profileStore.setState({
      profile: {
        _id: "company123",
        name: "TestCo",
        email: "test@example.com",
      } as any,
    });

    const initialData = {
      title: "Stage Dev",
      description: "Desc",
      location: "Paris",
      duration: "6 mois",
      sector: "Tech",
      startDate: "2025-01-01",
      minSalary: "1000",
      maxSalary: "2000",
      keySkills: ["JS", "React"],
      workMode: "teletravail" as const,
      isVisibleToStudents: true,
    };

    const { container } = render(
      <MemoryRouter>
        <CreatePostForm mode="edit" postId="post-abc" initialData={initialData} />
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
          adress: "Paris",
          type: "Télétravail",
          isVisible: true,
        },
      });
    });
  });

  it("redirige vers le dashboard si le post n'existe pas (loader)", async () => {
    userStore.setState({
      access: "token",
      get: () => ({ id: "company123", mail: "", role: "COMPANY", isVerified: true, isValid: true }) as any,
    });
    const fetchMock = vi.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    await expect(
      updatePostLoader({ params: { postId: "missing" } } as any)
    ).rejects.toHaveProperty("status", 302);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("redirige vers le dashboard si le post n'appartient pas à la compagnie (403)", async () => {
    userStore.setState({
      access: "token",
      get: () => ({ id: "company123", mail: "", role: "COMPANY", isVerified: true, isValid: true }) as any,
    });
    const fetchMock = vi.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: false,
      status: 403,
    } as any);

    await expect(
      updatePostLoader({ params: { postId: "other" } } as any)
    ).rejects.toHaveProperty("status", 302);
    expect(fetchMock).toHaveBeenCalled();
  });
});
