# BoloSach Security Specification (Phase 0)

## 1. Core Data Invariants
1. **PII Isolation**: `/users/{userId}` (containing `email`) is strictly isolated so only the authenticated owner (`request.auth.uid == userId && email_verified == true`) can read or write it.
2. **Creator Ownership**: A `Challenge` can only be created by an authenticated, email-verified user where `creatorId == request.auth.uid` and initial counters (`votesA`, `votesB`, `responseCount`) equal `0`.
3. **Terminal State Locking**: Once a `Challenge` has `status == 'closed'`, no votes, responses, or counter increments can occur on it.
4. **Atomic Counter Integrity**: Votes and secret responses can only increment `votesA`, `votesB`, or `responseCount` by `+1` per operation, paired atomically with a valid subcollection document (`existsAfter`) inside a Firestore `writeBatch` / `runTransaction`.
5. **Secret Inbox Privacy**: `/challenges/{challengeId}/responses/{responseId}` can only be read or listed by the challenge owner (`creatorId == request.auth.uid`) unless `isShowcased == true`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Identity Spoofing on Challenge Create**: Creating `/challenges/c1` with `creatorId: "someone_else"`.
2. **Shadow Field Injection on Profile**: Creating `/profiles/uid1` with an extra field `isVerified: true` or `role: "admin"`.
3. **PII Snooping**: Reading `/users/other_uid` as an authenticated non-owner.
4. **Counter Manipulation on Create**: Creating `/challenges/c2` with `votesA: 9999`.
5. **Bulk Counter Jump on Update**: Updating `/challenges/c1` with `votesA: existing.votesA + 50`.
6. **Vote Without Subcollection Proof**: Incrementing `votesA` by `+1` on `/challenges/c1` without creating a matching `/votes/{voteId}` document in the same batch (`existsAfter` fails).
7. **Post-Close Voting**: Voting on a challenge whose `status == "closed"`.
8. **Resource Exhaustion / ID Poisoning**: Creating `/challenges/<200-char-invalid-id!@#>` or injecting a 50KB `title` string.
9. **Timestamp Forgery**: Setting `createdAt` to a client-supplied past timestamp instead of `request.time`.
10. **Secret Inbox Snooping**: Listing `/challenges/c1/responses` as a different user where `isShowcased == false`.
11. **Self-Showcasing Secret Reply**: Submitting a secret response with `isShowcased: true` as a visitor.
12. **Unfiltered Challenge List Scraping**: Querying `/challenges` without filtering `visibility == 'public'` or `creatorId == auth.uid`.
