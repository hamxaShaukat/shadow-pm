//lib/db.ts
import { db } from "./firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export interface ProjectState {
  strategicIntent: string;
  thoughtSignature: string;
  updatedAt: any;
}

export async function saveAgentState(projectId: string, state: Partial<ProjectState>) {
  const docRef = doc(db, "projects", projectId);
  await setDoc(docRef, {
    ...state,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getAgentState(projectId: string): Promise<ProjectState | null> {
  const docRef = doc(db, "projects", projectId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as ProjectState;
  }
  return null;
}