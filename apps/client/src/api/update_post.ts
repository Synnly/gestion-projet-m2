export type UpdatePostPayload = {
  companyId: string;
  postId: string;
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

export async function updatePost({ companyId, postId, data }: UpdatePostPayload) {
  const response = await fetch(`${API_URL}/api/company/${companyId}/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message =
      (await response.json().catch(() => null))?.message ||
      "Erreur lors de la mise a jour de l'annonce";
    throw new Error(message);
  }

  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}
