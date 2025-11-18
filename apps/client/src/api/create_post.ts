// API helper used by the annonce creation flow.
export type CreatePostPayload = {
  title: string;
  description: string;
  location: string;
  duration: string;
  sector: string;
  startDate: string;
  minSalary?: string;
  maxSalary?: string;
  workMode: string;
  skills: string[];
  isVisibleToStudents: boolean;
};

export async function createPost(payload: CreatePostPayload) {
  const response = await fetch("http://localhost:3000/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la création de l’annonce");
  }

  return response.json();
}
