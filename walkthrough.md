# Security Summary

**Reviewed Files**: 11
**Issues Resolved**: 3

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Atomic Vote & Counter Locking | `firestore.rules` | 227–256 | Vote/response counters (`votesA`, `votesB`, `responseCount`) could be incremented via direct Firestore API calls without proving a new subcollection record was written in the same transaction. | High | Fixed | Added `lastEventId` mutual-lock checks using `!exists(...)`, `getAfter(...)`, `existsAfter(...)`, challenge `type` guards, and signed-in UID binding (`voteId == request.auth.uid`). |
| Unvalidated Photo URLs | `firestore.rules`, `src/types/bolosach.ts` | 35, 32 | `photoUrl` and `creatorPhotoUrl` accepted arbitrary strings up to 500 characters, leaving room for unsafe URL schemes if written directly. | Medium | Fixed | Restricted `photoUrl` and `creatorPhotoUrl` to empty string or `https://` URLs in both `firestore.rules` (`isValidHttpsOrEmpty`) and `sanitizeHttpsUrl()` across all components. |
| Untrusted Query Parameter Routing | `src/App.tsx`, `src/services/bolosachService.ts` | 48, 250 | The `?c=` URL query parameter was passed into Firestore document references without checking format and length constraints. | Medium | Fixed | Added strict `isValidFirestoreId()` checks (`^[a-zA-Z0-9_-]+$`, max 128 chars) on URL parsing, navigation, and every Firestore document/subcollection helper. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| PII Isolation | `firestore.rules` | `/users/{userId}` stores email PII and restricts `get`, `create`, and `update` strictly to the verified owner (`request.auth.uid == userId && email_verified == true`), with `list` disabled. |
| Secret Inbox Privacy | `firestore.rules` | `/challenges/{challengeId}/responses` restricts reads and list queries to the challenge creator (`creatorId == request.auth.uid`) unless explicitly marked `isShowcased == true` by the creator. |
| Terminal State Locking | `firestore.rules` | Once a challenge is closed (`status == 'closed'`), all vote and secret response actions are blocked at the rule level while the creator retains permission to toggle status. |
| Safe Rendering | `src/components/*.tsx` | All user-supplied questions, options, handles, and secret replies render exclusively through React JSX text bindings with zero raw HTML injection. |

## PoC Verification

### 1. Standalone Vote Counter Inflation (Without Subcollection Ballot)

#### Summary
| Field | Value |
|---|---|
| Issue Type | Non-atomic counter increment bypass |
| Impact | High |
| Affected File | `firestore.rules:227-256` |
| Test Scenario | Direct `updateDoc` sending `{ votesA: existing.votesA + 1, updatedAt: serverTimestamp() }` without writing a matching `/votes/{voteId}` record in the same transaction. |

#### How It Was Fixed
Challenge counter updates now require `lastEventId` in `affectedKeys()`, verify `!exists(.../votes/$(lastEventId))`, and assert via `getAfter(...)` that a matching vote document with `side == 'A'` was atomically created in the same transaction/batch.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Direct `updateDoc` arrives at `challenges/{challengeId}` with only `votesA` and `updatedAt`. | Enters `allow update` rule |
| 2 | `affectedKeys().hasOnly(['votesA', 'lastEventId', 'updatedAt'])` and `getAfter(.../votes/$(lastEventId))` evaluate. | No new vote document exists in transaction |
| 3 | Firestore rejects the write. | **Handled Safely (`PERMISSION_DENIED`)** |

#### Conclusion
**Fix Verified** - Counters can only advance by `+1` when paired atomically with a brand-new, non-duplicate ballot or response document of the matching challenge type.

### 2. Unsafe URL Scheme Injection via Profile Avatar

#### Summary
| Field | Value |
|---|---|
| Issue Type | Unsafe `src` URL scheme (`javascript:` / `data:`) |
| Impact | Medium |
| Affected File | `firestore.rules:33-35`, `src/types/bolosach.ts:32-44` |
| Test Scenario | Writing `photoUrl: "javascript:alert(1)"` to `/profiles/{uid}` or passing it into `BattleCard` / `ChallengeArena`. |

#### How It Was Fixed
Added `isValidHttpsOrEmpty()` regex validation (`^https://.*`) in `firestore.rules` and `sanitizeHttpsUrl()` in `src/types/bolosach.ts` before storing or rendering any avatar image.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Payload with `photoUrl: "javascript:alert(1)"` reaches Firestore rule or UI sanitizer. | Enters `isValidPublicProfile()` / `sanitizeHttpsUrl()` |
| 2 | `url.matches('^https://.*')` and `new URL(...).protocol === 'https:'` evaluate to false. | Write rejected / URL stripped to `""` |
| 3 | Final UI renders monogram fallback instead of unsafe URL. | **Handled Safely** |

#### Conclusion
**Fix Verified** - Only `https://` avatar URLs can be stored or rendered in the application.

### 3. Malformed Deep-Link Path Parameter (`?c=`)

#### Summary
| Field | Value |
|---|---|
| Issue Type | Unvalidated URL query parameter passed to Firestore document lookup |
| Impact | Medium |
| Affected File | `src/App.tsx:48-55`, `src/services/bolosachService.ts:250-258` |
| Test Scenario | Opening `/?c=../../users/victim_uid` or a 2,000-character string in the browser address bar. |

#### How It Was Fixed
Added `isValidFirestoreId()` enforcement (`^[a-zA-Z0-9_-]+$`, length `1..128`) when reading `?c=` from `window.location.search` and at the entry of every Firestore service function.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | `?c=../../users/victim_uid` arrives in `getInitialChallengeIdFromUrl()`. | Enters `isValidFirestoreId()` |
| 2 | Slash and dot characters fail `LIMITS.ID_REGEX`. | Returns `null` before Firestore call |
| 3 | App renders the normal public feed without issuing an invalid document lookup. | **Handled Safely** |

#### Conclusion
**Fix Verified** - Path-like or oversized `?c=` query values are rejected before reaching Firestore.
