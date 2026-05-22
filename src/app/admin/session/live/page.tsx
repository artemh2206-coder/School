import { Suspense } from "react";
import { LessonRoomShell } from "@/components/LessonRoomShell";

export default function AdminSessionLivePage() {
  return (
    <Suspense>
      <LessonRoomShell
        backHref="/admin/sessions"
        isObserver
        participantId="ADMIN"
        participantName="Администратор"
        participantRole="ADMIN"
      />
    </Suspense>
  );
}
