"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUser, getUsersByFamily, seedInitialDataIfNeeded,
  UserDoc,
} from "@/lib/families";
import { SUPER_ADMIN_EMAIL, UserRole, isSuperAdmin, LEGACY_ROLE_MAP } from "@/lib/roles";

interface UserContextType {
  firebaseUser: User | null;
  userDoc: UserDoc | null;
  familyMembers: UserDoc[];
  loading: boolean;
  role: UserRole | null;
  familyId: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  firebaseUser: null,
  userDoc: null,
  familyMembers: [],
  loading: true,
  role: null,
  familyId: null,
  isAdmin: false,
  isSuperAdmin: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [familyMembers, setFamilyMembers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (!user?.email) {
        setUserDoc(null);
        setFamilyMembers([]);
        setLoading(false);
        return;
      }

      const email = user.email.toLowerCase();

      // Seed initial data on first superAdmin login
      if (isSuperAdmin(email)) {
        await seedInitialDataIfNeeded(email);
      }

      // Try loading from Firestore
      let doc = await getUser(email);

      // Fallback: create a temporary doc from hardcoded map (before seeding)
      if (!doc) {
        const legacyRole = LEGACY_ROLE_MAP[email];
        if (legacyRole !== undefined) {
          const role: UserRole = isSuperAdmin(email)
            ? "superAdmin"
            : legacyRole === "admin"
            ? "parent"
            : "child";
          doc = {
            email,
            displayName: email.split("@")[0],
            role,
            familyId: null,
            createdAt: new Date(),
          };
        }
      }

      setUserDoc(doc);

      if (doc?.familyId) {
        const members = await getUsersByFamily(doc.familyId);
        setFamilyMembers(members);
      } else {
        setFamilyMembers([]);
      }

      setLoading(false);
    });
    return () => unsub();
  }, []);

  const role = userDoc?.role ?? null;
  const familyId = userDoc?.familyId ?? null;
  const _isSuperAdmin = role === "superAdmin";
  const isAdmin = role === "superAdmin" || role === "familyAdmin";

  return (
    <UserContext.Provider
      value={{
        firebaseUser,
        userDoc,
        familyMembers,
        loading,
        role,
        familyId,
        isAdmin,
        isSuperAdmin: _isSuperAdmin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
