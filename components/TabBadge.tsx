"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/userContext";
import { getAllTasks, getTasksForUser } from "@/lib/firestore";

const BASE_TITLE = "FamilyTask";

export default function TabBadge() {
  const { isAdmin, userDoc, familyId, loading } = useUser();

  useEffect(() => {
    if (loading || !userDoc) return;

    let cancelled = false;

    async function fetchCount() {
      try {
        let count = 0;
        if (isAdmin) {
          // Admin/parent: count tasks awaiting approval (status "done")
          const tasks = await getAllTasks(familyId);
          count = tasks.filter((t) => t.status === "done").length;
        } else {
          // Child: count own pending tasks
          const tasks = await getTasksForUser(userDoc!.email, familyId ?? undefined);
          count = tasks.filter((t) => t.status === "pending").length;
        }
        if (!cancelled) {
          document.title = count > 0 ? `(${count}) ${BASE_TITLE}` : BASE_TITLE;
        }
      } catch {
        if (!cancelled) document.title = BASE_TITLE;
      }
    }

    fetchCount();

    return () => {
      cancelled = true;
      document.title = BASE_TITLE;
    };
  }, [loading, userDoc, isAdmin, familyId]);

  return null;
}
