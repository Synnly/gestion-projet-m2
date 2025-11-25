// API helper used by the annonce creation flow.
export type CreatePostPayload = {
  companyId: string;
  data: {
    title: string;
    description: string;
    duration?: string;
    startDate?: string;
    minSalary?: number;
    maxSalary?: number;
    sector?: string;
    keySkills?: string[];
    adress?: string;
    type?: string;
    isVisible?: boolean;
  };
};

const API_URL = import.meta.env.VITE_APIURL || "http://localhost:3000";

export async function createPost({ companyId, data }: CreatePostPayload) {
  console.log("createPost: posting with companyId", companyId);
  const response = await fetch(`${API_URL}/api/company/${companyId}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message =
      (await response.json().catch(() => null))?.message ||
      "Erreur lors de la création de l'annonce";
    throw new Error(message);
  }

  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}
