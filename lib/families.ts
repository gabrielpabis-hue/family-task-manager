import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  deleteDoc, setDoc, query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserRole, SUPER_ADMIN_EMAIL } from "./roles";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserDoc {
  email: string;
  displayName: string;
  role: UserRole;
  familyId: string | null;
  createdAt: Date;
}

export interface FamilyDoc {
  id: string;
  name: string;
  familyAdminEmail: string | null;
  createdAt: Date;
  createdBy: string;
}

export interface RequestDoc {
  id: string;
  type: "newFamily" | "deleteFamily";
  requesterEmail: string;
  requesterName: string;
  familyName: string;
  familyId: string | null;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUser(email: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", email.toLowerCase()));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    email: d.email,
    displayName: d.displayName ?? email.split("@")[0],
    role: d.role,
    familyId: d.familyId ?? null,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  };
}

export async function getAllUsers(): Promise<UserDoc[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      email: data.email,
      displayName: data.displayName ?? data.email.split("@")[0],
      role: data.role,
      familyId: data.familyId ?? null,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as UserDoc;
  }).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getUsersByFamily(familyId: string): Promise<UserDoc[]> {
  const snap = await getDocs(query(collection(db, "users"), where("familyId", "==", familyId)));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      email: data.email,
      displayName: data.displayName ?? data.email.split("@")[0],
      role: data.role,
      familyId: data.familyId ?? null,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as UserDoc;
  });
}

export async function createUser(data: Omit<UserDoc, "createdAt">): Promise<void> {
  await setDoc(doc(db, "users", data.email.toLowerCase()), {
    ...data,
    email: data.email.toLowerCase(),
    createdAt: serverTimestamp(),
  });
}

export async function updateUser(
  email: string,
  data: Partial<Omit<UserDoc, "email" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "users", email.toLowerCase()), data as Record<string, unknown>);
}

export async function deleteUser(email: string): Promise<void> {
  await deleteDoc(doc(db, "users", email.toLowerCase()));
}

// ── Families ──────────────────────────────────────────────────────────────────

export async function getFamily(id: string): Promise<FamilyDoc | null> {
  const snap = await getDoc(doc(db, "families", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    name: d.name,
    familyAdminEmail: d.familyAdminEmail ?? null,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
    createdBy: d.createdBy,
  };
}

export async function getAllFamilies(): Promise<FamilyDoc[]> {
  const snap = await getDocs(collection(db, "families"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      familyAdminEmail: data.familyAdminEmail ?? null,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      createdBy: data.createdBy,
    } as FamilyDoc;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createFamily(data: {
  name: string;
  familyAdminEmail: string | null;
  createdBy: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "families"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateFamily(
  id: string,
  data: Partial<Pick<FamilyDoc, "name" | "familyAdminEmail">>
): Promise<void> {
  await updateDoc(doc(db, "families", id), data as Record<string, unknown>);
}

export async function deleteFamily(id: string): Promise<void> {
  await deleteDoc(doc(db, "families", id));
}

// ── Requests ──────────────────────────────────────────────────────────────────

export async function getAllRequests(): Promise<RequestDoc[]> {
  const snap = await getDocs(collection(db, "requests"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type,
      requesterEmail: data.requesterEmail,
      requesterName: data.requesterName ?? "",
      familyName: data.familyName ?? "",
      familyId: data.familyId ?? null,
      message: data.message ?? "",
      status: data.status,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      resolvedAt: data.resolvedAt?.toDate?.() ?? null,
      resolvedBy: data.resolvedBy ?? null,
    } as RequestDoc;
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPendingRequestCount(): Promise<number> {
  const snap = await getDocs(
    query(collection(db, "requests"), where("status", "==", "pending"))
  );
  return snap.size;
}

export async function createRequest(data: {
  type: "newFamily" | "deleteFamily";
  requesterEmail: string;
  requesterName: string;
  familyName: string;
  familyId: string | null;
  message: string;
}): Promise<void> {
  await addDoc(collection(db, "requests"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
    resolvedAt: null,
    resolvedBy: null,
  });
}

export async function resolveRequest(
  id: string,
  status: "approved" | "rejected",
  resolvedBy: string
): Promise<void> {
  await updateDoc(doc(db, "requests", id), {
    status,
    resolvedAt: serverTimestamp(),
    resolvedBy,
  });
}

// ── Seed initial data ─────────────────────────────────────────────────────────

export async function seedInitialDataIfNeeded(superAdminEmail: string): Promise<void> {
  const existing = await getDocs(collection(db, "users"));
  if (existing.size > 0) return;

  const familyRef = await addDoc(collection(db, "families"), {
    name: "Rodzina Pabis",
    familyAdminEmail: null,
    createdAt: serverTimestamp(),
    createdBy: superAdminEmail,
  });
  const familyId = familyRef.id;

  const initialUsers: Omit<UserDoc, "createdAt">[] = [
    { email: "alicja.b.pabis@gmail.com", displayName: "Alicja", role: "parent", familyId },
    { email: "igipabis@gmail.com", displayName: "Ignacy", role: "child", familyId },
    { email: "gabik.pabik@gmail.com", displayName: "Gabriela", role: "child", familyId },
    { email: superAdminEmail, displayName: "Gabriel", role: "superAdmin", familyId: null },
  ];

  for (const u of initialUsers) {
    await setDoc(doc(db, "users", u.email.toLowerCase()), {
      ...u,
      createdAt: serverTimestamp(),
    });
  }
}
