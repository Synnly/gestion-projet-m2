import { redirect } from "react-router";
import { userStore } from "../store/userStore";
import type { WorkMode } from "../store/CreatePostStore";

export type LoaderPost = {
  _id: string;
  title: string;
  description: string;
  duration?: string;
  startDate?: string;
  minSalary?: number;
  maxSalary?: number;
  sector?: string;
  keySkills?: string[];
  adress?: string;
  type?: WorkMode | string;
  isVisible?: boolean;
};

const API_URL = import.meta.env.VITE_APIURL || "http://localhost:3000";

export async function updatePostLoader({ params }: { params: { postId?: string } }) {
  const access = userStore.getState().access;
  if (!access) {
    throw redirect("/signin");
  }
  const tokenPayload = userStore.getState().get(access);
  if (!tokenPayload) {
    throw redirect("/signin");
  }
  const companyId = tokenPayload.id;
  const postId = params.postId;
  if (!postId) {
    throw redirect("/company/dashboard");
  }

  const res = await fetch(`${API_URL}/api/company/${companyId}/posts/${postId}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw redirect("/company/dashboard");
  }

  const post: LoaderPost = await res.json();
  return { post, companyId, postId };
}
