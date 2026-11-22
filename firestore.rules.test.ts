/**
 * Dirty Dozen Security Rule Verification Vectors for BoloSach
 * Maps each attack vector in security_spec.md to expected PERMISSION_DENIED outcomes.
 */

export const DIRTY_DOZEN_VECTORS = [
  {
    name: '1. Identity Spoofing on Challenge Create',
    path: 'challenges/fake_challenge_1',
    operation: 'create',
    payload: { creatorId: 'other_user_uid', title: 'Who wins?' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Shadow Field Injection on PublicProfile',
    path: 'profiles/user_1',
    operation: 'create',
    payload: { uid: 'user_1', isVerified: true, role: 'admin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. PII Snooping on Private User Document',
    path: 'users/victim_uid',
    operation: 'get',
    payload: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Counter Manipulation on Challenge Create',
    path: 'challenges/fake_challenge_2',
    operation: 'create',
    payload: { votesA: 9999, votesB: 0, responseCount: 0 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Bulk Counter Jump on Challenge Update',
    path: 'challenges/active_challenge',
    operation: 'update',
    payload: { votesA: 500 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Post-Close Voting on Closed Challenge',
    path: 'challenges/closed_challenge/votes/voter_1',
    operation: 'create',
    payload: { challengeId: 'closed_challenge', side: 'A', voterUid: 'voter_1' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. Resource Exhaustion / Invalid ID Poisoning',
    path: 'challenges/invalid!@#id$$$',
    operation: 'create',
    payload: { title: 'x'.repeat(2000) },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Client Timestamp Forgery',
    path: 'challenges/ts_spoof',
    operation: 'create',
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Secret Inbox Snooping by Non-Owner',
    path: 'challenges/c1/responses',
    operation: 'list',
    payload: { filter: 'isShowcased == false' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Self-Showcasing Secret Reply by Visitor',
    path: 'challenges/c1/responses/r1',
    operation: 'create',
    payload: { isShowcased: true, creatorReply: 'Spoofed' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Immutable Creator Modification on Update',
    path: 'challenges/c1',
    operation: 'update',
    payload: { creatorId: 'attacker_uid' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Unfiltered Challenge List Scraping',
    path: 'challenges',
    operation: 'list',
    payload: { unfiltered: true },
    expected: 'PERMISSION_DENIED',
  },
] as const;
