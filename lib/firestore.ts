import {
  collection, addDoc, updateDoc, deleteDoc, doc, query, where,
  getDocs, getDoc, serverTimestamp, increment, setDoc, writeBatch,
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
  endDate?: string | null;
  status: TaskStatus;
  basePoints: number;
  qualityScore?: QualityScore | null;
  finalPoints?: number | null;
  isParentTask: boolean;
  recurring?: boolean;
  familyId?: string | null;
  proofPhotoUrl?: string;
  createdAt: Date;
}

export interface PointEntry {
  id: string;
  userId: string;
  points: number;
  awardedAt: Date;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function createTask(
  data: Omit<Task, "id" | "createdAt">,
  familyId?: string | null
) {
  return addDoc(collection(db, "tasks"), {
    ...data,
    familyId: familyId ?? data.familyId ?? null,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getTasksForUser(
  email: string,
  familyId?: string | null
): Promise<Task[]> {
  const col = collection(db, "tasks");
  const snap = familyId
    ? await getDocs(query(col, where("familyId", "==", familyId), where("assignedTo", "==", email)))
    : await getDocs(query(col, where("assignedTo", "==", email)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Task))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function getAllTasks(familyId?: string | null): Promise<Task[]> {
  const col = collection(db, "tasks");
  const snap = familyId
    ? await getDocs(query(col, where("familyId", "==", familyId)))
    : await getDocs(col);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Task))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function deleteTask(taskId: string) {
  await deleteDoc(doc(db, "tasks", taskId));
}

export async function getTask(taskId: string): Promise<Task | null> {
  const snap = await getDoc(doc(db, "tasks", taskId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Task;
}

export async function updateTask(
  taskId: string,
  data: Partial<Omit<Task, "id" | "createdAt">>
) {
  await updateDoc(doc(db, "tasks", taskId), data as Record<string, unknown>);
}

export async function markTaskDone(taskId: string, proofPhotoUrl?: string) {
  await updateDoc(doc(db, "tasks", taskId), {
    status: "done",
    ...(proofPhotoUrl ? { proofPhotoUrl } : {}),
  });
}

// ── Approve & points ──────────────────────────────────────────────────────────

export async function approveTask(
  taskId: string,
  qualityScore: QualityScore,
  approvedBy: string
) {
  const taskSnap = await getDoc(doc(db, "tasks", taskId));
  const task = taskSnap.data() as Task;
  const finalPoints = calcFinalPoints(task.basePoints, qualityScore);

  await updateDoc(doc(db, "tasks", taskId), { status: "approved", qualityScore, finalPoints });

  await addDoc(collection(db, "pointsHistory"), {
    userId: task.assignedTo,
    taskId,
    points: finalPoints,
    qualityScore,
    awardedBy: approvedBy,
    awardedAt: serverTimestamp(),
    settled: false,
    familyId: task.familyId ?? null,
  });

  const balanceRef = doc(db, "balances", task.assignedTo);
  try {
    await updateDoc(balanceRef, {
      currentBalance: increment(finalPoints),
      totalEarned: increment(finalPoints),
    });
  } catch {
    await setDoc(balanceRef, {
      currentBalance: finalPoints,
      totalEarned: finalPoints,
      lastSettledAt: null,
    });
  }
}

// ── Balances ──────────────────────────────────────────────────────────────────

export async function getBalance(email: string) {
  const snap = await getDoc(doc(db, "balances", email));
  return snap.exists() ? snap.data() : { currentBalance: 0, totalEarned: 0 };
}

export async function getAllBalances(emails?: string[]) {
  const targets = emails ?? ["igipabis@gmail.com", "gabik.pabik@gmail.com"];
  return Promise.all(
    targets.map(async (email) => {
      const data = await getBalance(email);
      return { email, ...data };
    })
  );
}

export async function settleBalance(email: string, settledBy: string) {
  const balanceRef = doc(db, "balances", email);
  const q = query(
    collection(db, "pointsHistory"),
    where("userId", "==", email),
    where("settled", "==", false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { settled: true }));
  batch.update(balanceRef, { currentBalance: 0, lastSettledAt: serverTimestamp() });
  await batch.commit();
}

// ── Points history ────────────────────────────────────────────────────────────

export async function getAllPointsHistory(familyId?: string | null): Promise<PointEntry[]> {
  const col = collection(db, "pointsHistory");
  const snap = familyId
    ? await getDocs(query(col, where("familyId", "==", familyId)))
    : await getDocs(col);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId as string,
        points: data.points as number,
        awardedAt: (data.awardedAt?.toDate?.() ?? new Date()) as Date,
      };
    })
    .sort((a, b) => a.awardedAt.getTime() - b.awardedAt.getTime());
}
