import {
  collection, addDoc, updateDoc, deleteDoc, doc, query, where,
  orderBy, getDocs, getDoc, serverTimestamp, increment, setDoc, writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { QualityScore, calcFinalPoints } from "./points";

export type TaskStatus = "pending" | "done" | "approved";
export type Priority = "normal" | "important" | "critical";

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  createdBy: string;
  priority: Priority;
  dueDate: string;
  status: TaskStatus;
  basePoints: number;
  qualityScore?: QualityScore | null;
finalPoints?: number | null;
  isParentTask: boolean;
  recurring?: boolean;
  createdAt: Date;
}

export async function createTask(data: Omit<Task, "id" | "createdAt">) {
  return addDoc(collection(db, "tasks"), { ...data, status: "pending", createdAt: serverTimestamp() });
}

export async function getTasksForUser(email: string): Promise<Task[]> {
  const q = query(collection(db, "tasks"), where("assignedTo", "==", email), orderBy("dueDate", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

export async function getAllTasks(): Promise<Task[]> {
  const q = query(collection(db, "tasks"), orderBy("dueDate", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

export async function deleteTask(taskId: string) {
  await deleteDoc(doc(db, "tasks", taskId));
}

export async function markTaskDone(taskId: string) {
  await updateDoc(doc(db, "tasks", taskId), { status: "done" });
}

export async function approveTask(taskId: string, qualityScore: QualityScore, approvedBy: string) {
  const taskSnap = await getDoc(doc(db, "tasks", taskId));
  const task = taskSnap.data() as Task;
  const finalPoints = calcFinalPoints(task.basePoints, qualityScore);

  await updateDoc(doc(db, "tasks", taskId), { status: "approved", qualityScore, finalPoints });

  await addDoc(collection(db, "pointsHistory"), {
    userId: task.assignedTo, taskId, points: finalPoints,
    qualityScore, awardedBy: approvedBy, awardedAt: serverTimestamp(), settled: false,
  });

  const balanceRef = doc(db, "balances", task.assignedTo);
  try {
    await updateDoc(balanceRef, { currentBalance: increment(finalPoints), totalEarned: increment(finalPoints) });
  } catch {
    await setDoc(balanceRef, { currentBalance: finalPoints, totalEarned: finalPoints, lastSettledAt: null });
  }
}

export async function getBalance(email: string) {
  const snap = await getDoc(doc(db, "balances", email));
  return snap.exists() ? snap.data() : { currentBalance: 0, totalEarned: 0 };
}

export async function getAllBalances() {
  const children = ["igipabis@gmail.com", "gabik.pabik@gmail.com"];
  return Promise.all(children.map(async (email) => {
    const data = await getBalance(email);
    return { email, ...data };
  }));
}

export async function settleBalance(email: string, settledBy: string) {
  const balanceRef = doc(db, "balances", email);
  const q = query(collection(db, "pointsHistory"), where("userId", "==", email), where("settled", "==", false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { settled: true }));
  batch.update(balanceRef, { currentBalance: 0, lastSettledAt: serverTimestamp() });
  await batch.commit();
}
