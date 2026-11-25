# Security Specification — HKBP Jatisampurna Wijk Parserahan

## 1. Data Invariants
1. Setiap dokumen di `/aspirations/{aspirationId}` wajib memiliki `senderName`, `weyk`, `subject`, `message`, `status`, dan `createdAt` sesuai `firebase-blueprint.json`.
2. Saat pembuatan dokumen baru (`create`), `status` wajib bernilai `'Baru'` dan `createdAt` wajib sama dengan `request.time`.
3. Pengirim publik tidak dapat membaca (`get` / `list`) dokumen aspirasi milik jemaat lain. Hanya Admin Utama terverifikasi (`isRootAdmin()` / `isAdmin()`) atau pemilik `authorUid` yang dapat membaca dokumen miliknya.
4. Perubahan (`update`) dan penghapusan (`delete`) pada `/aspirations/{aspirationId}` hanya diizinkan bagi Admin Utama terverifikasi, dengan `senderName`, `weyk`, `subject`, `message`, dan `createdAt` bersifat immutable.
5. Dokumen pada `/admins/{adminUid}` hanya dapat dikelola oleh root admin terverifikasi (`email_verified == true`).

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Shadow Field Injection on Create**: `{ "senderName": "Budi", "weyk": "Wijk Parserahan", "subject": "Masukan", "message": "Tes masukan beta", "status": "Baru", "isAdmin": true, "createdAt": "<request.time>" }` -> Rejected by `hasOnly(...)`.
2. **Status Shortcutting on Create**: `{ "senderName": "Budi", "weyk": "Wijk Parserahan", "subject": "Masukan", "message": "Tes masukan beta", "status": "Selesai", "createdAt": "<request.time>" }` -> Rejected (`status == 'Baru'`).
3. **Spoofed Client Timestamp on Create**: `{ "senderName": "Budi", "weyk": "Wijk Parserahan", "subject": "Masukan", "message": "Tes masukan beta", "status": "Baru", "createdAt": "2020-01-01T00:00:00Z" }` -> Rejected (`createdAt == request.time`).
4. **Author UID Spoofing on Create**: `{ "senderName": "Budi", "weyk": "Wijk Parserahan", "subject": "Masukan", "message": "Tes masukan beta", "status": "Baru", "authorUid": "victim-uid", "createdAt": "<request.time>" }` -> Rejected (`authorUid == request.auth.uid`).
5. **Resource Exhaustion (>1500 char message)**: `{ "senderName": "Budi", "weyk": "Wijk Parserahan", "subject": "Masukan", "message": "<1501 chars>", "status": "Baru", "createdAt": "<request.time>" }` -> Rejected (`message.size() <= 1500`).
6. **ID Poisoning (>128 chars or invalid chars)**: Create `/aspirations/bad$id/..` or 200-char ID -> Rejected by `isValidId(aspirationId)`.
7. **Unauthenticated Blanket List**: `list('/aspirations')` when `request.auth == null` -> Rejected.
8. **Non-Admin List All Aspirations**: `list('/aspirations')` as authenticated regular user without `where('authorUid', '==', uid)` -> Rejected.
9. **Unverified Admin Email Spoof**: `get/list('/aspirations')` with `token.email == 'bca.ccpl@gmail.com'` and `token.email_verified == false` -> Rejected.
10. **Non-Admin Status Tampering**: `update('/aspirations/asp-1', { status: 'Selesai', updatedAt: '<request.time>' })` as regular user -> Rejected.
11. **Immutable Message Mutation by Admin**: `update('/aspirations/asp-1', { message: 'Edited message', status: 'Dibaca', updatedAt: '<request.time>' })` -> Rejected by `affectedKeys().hasOnly(['status', 'adminNote', 'updatedAt'])`.
12. **Self-Assigned Admin Escalation**: `create('/admins/attackerUid', { email: 'attacker@example.com', name: 'Attacker', role: 'Admin Utama (Ketua)', createdAt: '<request.time>' })` -> Rejected.
