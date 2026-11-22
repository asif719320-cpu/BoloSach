import { User } from 'firebase/auth';
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Challenge,
  ChallengeStatus,
  ChallengeVisibility,
  CreateChallengeInput,
  isValidFirestoreId,
  LangCode,
  LIMITS,
  PublicProfile,
  sanitizeHttpsUrl,
  SecretMoodTag,
  SecretResponse,
  VoteRecord,
} from '../types/bolosach';

const VISITOR_STORAGE_KEY = 'bolosach_visitor_id';

export function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing && /^guest_[a-zA-Z0-9_-]+$/.test(existing) && existing.length <= 64) {
      return existing;
    }
    const randomPart =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    const id = `guest_${randomPart.slice(0, 24)}`;
    localStorage.setItem(VISITOR_STORAGE_KEY, id);
    return id;
  } catch {
    return `guest_${Date.now().toString(36)}`;
  }
}

export function getLocalVote(challengeId: string): 'A' | 'B' | null {
  if (!isValidFirestoreId(challengeId)) return null;
  try {
    const val = localStorage.getItem(`bolosach_vote_${challengeId}`);
    return val === 'A' || val === 'B' ? val : null;
  } catch {
    return null;
  }
}

export function saveLocalVote(challengeId: string, side: 'A' | 'B'): void {
  if (!isValidFirestoreId(challengeId)) return;
  try {
    localStorage.setItem(`bolosach_vote_${challengeId}`, side);
  } catch {
    // Ignore storage quota errors
  }
}

function buildSafeHandle(user: User): string {
  const source = user.displayName || user.email?.split('@')[0] || 'creator';
  const cleaned = source.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  const suffix = user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toLowerCase() || '01';
  const handle = cleaned.length >= 2 ? `${cleaned}_${suffix}` : `creator_${suffix}`;
  return handle.slice(0, LIMITS.HANDLE_MAX);
}

export async function ensureUserDocuments(
  user: User,
  preferredLang: LangCode
): Promise<PublicProfile> {
  if (!isValidFirestoreId(user.uid)) {
    throw new Error('Invalid user account identifier.');
  }

  const userPath = `users/${user.uid}`;
  const profilePath = `profiles/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const profileRef = doc(db, 'profiles', user.uid);

  let userExists = false;
  try {
    const userSnap = await getDoc(userRef);
    userExists = userSnap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  let profileSnap;
  try {
    profileSnap = await getDoc(profileRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, profilePath);
  }

  if (profileSnap.exists() && userExists) {
    return profileSnap.data() as PublicProfile;
  }

  const batch = writeBatch(db);
  const safeEmail = (user.email || `${user.uid}@users.local`).slice(0, 200);
  const safeDisplayName =
    (user.displayName || 'Creator').trim().slice(0, LIMITS.DISPLAY_NAME_MAX) || 'Creator';
  const safePhoto = sanitizeHttpsUrl(user.photoURL);
  const safeHandle = buildSafeHandle(user);

  if (!userExists) {
    batch.set(userRef, {
      uid: user.uid,
      email: safeEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (!profileSnap.exists()) {
    batch.set(profileRef, {
      uid: user.uid,
      displayName: safeDisplayName,
      handle: safeHandle,
      photoUrl: safePhoto,
      bio: '',
      preferredLang,
      totalChallenges: 0,
      totalVotesReceived: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, profilePath);
  }

  try {
    const fresh = await getDoc(profileRef);
    return fresh.data() as PublicProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, profilePath);
  }
}

export async function updateCreatorProfile(
  uid: string,
  updates: {
    displayName: string;
    handle: string;
    bio: string;
    preferredLang: LangCode;
    photoUrl: string;
  }
): Promise<void> {
  if (!isValidFirestoreId(uid)) {
    throw new Error('Invalid profile identifier.');
  }
  const path = `profiles/${uid}`;
  const cleanHandle = updates.handle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, LIMITS.HANDLE_MAX);

  if (cleanHandle.length < LIMITS.HANDLE_MIN) {
    throw new Error('Handle must contain at least 2 alphanumeric or underscore characters.');
  }

  const cleanName = updates.displayName.trim().slice(0, LIMITS.DISPLAY_NAME_MAX);
  if (!cleanName) {
    throw new Error('Display name is required.');
  }

  try {
    await updateDoc(doc(db, 'profiles', uid), {
      displayName: cleanName,
      handle: cleanHandle,
      bio: updates.bio.trim().slice(0, LIMITS.BIO_MAX),
      preferredLang: updates.preferredLang,
      photoUrl: sanitizeHttpsUrl(updates.photoUrl),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function createChallenge(
  user: User,
  profile: PublicProfile,
  input: CreateChallengeInput
): Promise<string> {
  const cleanTitle = input.title.trim().slice(0, LIMITS.TITLE_MAX);
  const cleanSideA = input.sideALabel.trim().slice(0, LIMITS.SIDE_MAX);
  const cleanSideB = input.sideBLabel.trim().slice(0, LIMITS.SIDE_MAX);

  if (cleanTitle.length < LIMITS.TITLE_MIN) {
    throw new Error('Question must be at least 3 characters.');
  }
  if (cleanSideA.length < LIMITS.SIDE_MIN || cleanSideB.length < LIMITS.SIDE_MIN) {
    throw new Error('Both options must be filled.');
  }

  const challengeRef = doc(collection(db, 'challenges'));
  const profileRef = doc(db, 'profiles', user.uid);
  const batch = writeBatch(db);

  batch.set(challengeRef, {
    id: challengeRef.id,
    creatorId: user.uid,
    creatorName: profile.displayName.slice(0, LIMITS.DISPLAY_NAME_MAX),
    creatorHandle: profile.handle.slice(0, LIMITS.HANDLE_MAX),
    creatorPhotoUrl: sanitizeHttpsUrl(profile.photoUrl),
    type: input.type,
    category: input.category,
    title: cleanTitle,
    sideALabel: cleanSideA,
    sideBLabel: cleanSideB,
    votesA: 0,
    votesB: 0,
    responseCount: 0,
    lastEventId: '',
    visibility: input.visibility,
    status: 'active',
    lang: input.lang,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(profileRef, {
    totalChallenges: increment(1),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return challengeRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `challenges/${challengeRef.id}`);
  }
}

export async function updateChallengeMeta(
  challengeId: string,
  updates: { status?: ChallengeStatus; visibility?: ChallengeVisibility }
): Promise<void> {
  if (!isValidFirestoreId(challengeId)) {
    throw new Error('Invalid challenge identifier.');
  }
  const path = `challenges/${challengeId}`;
  try {
    await updateDoc(doc(db, 'challenges', challengeId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteChallengeById(challengeId: string): Promise<void> {
  if (!isValidFirestoreId(challengeId)) {
    throw new Error('Invalid challenge identifier.');
  }
  const path = `challenges/${challengeId}`;
  try {
    await deleteDoc(doc(db, 'challenges', challengeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function castVote(
  challengeId: string,
  side: 'A' | 'B',
  currentUser: User | null
): Promise<{ alreadyVoted: boolean; side: 'A' | 'B' }> {
  if (!isValidFirestoreId(challengeId)) {
    throw new Error('Invalid challenge identifier.');
  }
  const voterId = currentUser ? currentUser.uid : getOrCreateVisitorId();
  const challengeRef = doc(db, 'challenges', challengeId);
  const voteRef = doc(db, 'challenges', challengeId, 'votes', voterId);
  const path = `challenges/${challengeId}/votes/${voterId}`;

  try {
    const result = await runTransaction(db, async (tx) => {
      const challengeSnap = await tx.get(challengeRef);
      if (!challengeSnap.exists()) {
        throw new Error('Challenge does not exist.');
      }
      const data = challengeSnap.data() as Challenge;
      if (data.status !== 'active') {
        throw new Error('Voting for this challenge is closed.');
      }

      const voteSnap = await tx.get(voteRef);
      if (voteSnap.exists()) {
        const existingSide = (voteSnap.data().side === 'B' ? 'B' : 'A') as 'A' | 'B';
        return { alreadyVoted: true, side: existingSide };
      }

      tx.set(voteRef, {
        challengeId,
        side,
        voterUid: currentUser ? currentUser.uid : 'guest',
        createdAt: serverTimestamp(),
      });

      tx.update(challengeRef, {
        [side === 'A' ? 'votesA' : 'votesB']: (side === 'A' ? data.votesA : data.votesB) + 1,
        lastEventId: voterId,
        updatedAt: serverTimestamp(),
      });

      return { alreadyVoted: false, side };
    });

    saveLocalVote(challengeId, result.side);
    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function checkRemoteVote(
  challengeId: string,
  currentUser: User | null
): Promise<'A' | 'B' | null> {
  if (!isValidFirestoreId(challengeId)) return null;
  const cached = getLocalVote(challengeId);
  if (cached) return cached;

  const voterId = currentUser ? currentUser.uid : getOrCreateVisitorId();
  const voteRef = doc(db, 'challenges', challengeId, 'votes', voterId);
  const path = `challenges/${challengeId}/votes/${voterId}`;

  try {
    const snap = await getDoc(voteRef);
    if (snap.exists()) {
      const side = snap.data().side === 'B' ? 'B' : 'A';
      saveLocalVote(challengeId, side);
      return side;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function submitSecretResponse(
  challengeId: string,
  creatorId: string,
  message: string,
  moodTag: SecretMoodTag
): Promise<void> {
  if (!isValidFirestoreId(challengeId) || !isValidFirestoreId(creatorId)) {
    throw new Error('Invalid challenge reference.');
  }
  const cleanMessage = message.trim().slice(0, LIMITS.SECRET_MAX);
  if (cleanMessage.length < LIMITS.SECRET_MIN) {
    throw new Error('Message is too short.');
  }

  const responseRef = doc(collection(db, 'challenges', challengeId, 'responses'));
  const challengeRef = doc(db, 'challenges', challengeId);
  const batch = writeBatch(db);

  batch.set(responseRef, {
    challengeId,
    creatorId,
    message: cleanMessage,
    moodTag,
    isShowcased: false,
    creatorReply: '',
    createdAt: serverTimestamp(),
  });

  batch.update(challengeRef, {
    responseCount: increment(1),
    lastEventId: responseRef.id,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.CREATE,
      `challenges/${challengeId}/responses/${responseRef.id}`
    );
  }
}

export async function updateSecretResponseShowcase(
  challengeId: string,
  responseId: string,
  isShowcased: boolean,
  creatorReply: string
): Promise<void> {
  if (!isValidFirestoreId(challengeId) || !isValidFirestoreId(responseId)) {
    throw new Error('Invalid response reference.');
  }
  const path = `challenges/${challengeId}/responses/${responseId}`;
  try {
    await updateDoc(doc(db, 'challenges', challengeId, 'responses', responseId), {
      isShowcased,
      creatorReply: creatorReply.trim().slice(0, LIMITS.REPLY_MAX),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteSecretResponse(
  challengeId: string,
  responseId: string
): Promise<void> {
  if (!isValidFirestoreId(challengeId) || !isValidFirestoreId(responseId)) {
    throw new Error('Invalid response reference.');
  }
  const path = `challenges/${challengeId}/responses/${responseId}`;
  try {
    await deleteDoc(doc(db, 'challenges', challengeId, 'responses', responseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

function sortByCreatedAtDesc<T extends { createdAt: { toMillis?: () => number } | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const msA = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0;
    const msB = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0;
    return msB - msA;
  });
}

export function subscribePublicChallenges(
  onData: (challenges: Challenge[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'challenges'), where('visibility', '==', 'public'), limit(60));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ ...(d.data() as Challenge), id: d.id }));
      onData(sortByCreatedAtDesc(rows));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'challenges');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeMyChallenges(
  uid: string,
  onData: (challenges: Challenge[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  if (!isValidFirestoreId(uid)) {
    onError(new Error('Invalid user ID.'));
    return () => {};
  }
  const q = query(collection(db, 'challenges'), where('creatorId', '==', uid), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ ...(d.data() as Challenge), id: d.id }));
      onData(sortByCreatedAtDesc(rows));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, `challenges?creatorId=${uid}`);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeChallengeById(
  challengeId: string,
  onData: (challenge: Challenge | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  if (!isValidFirestoreId(challengeId)) {
    onData(null);
    return () => {};
  }
  const path = `challenges/${challengeId}`;
  return onSnapshot(
    doc(db, 'challenges', challengeId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData({ ...(snapshot.data() as Challenge), id: snapshot.id });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeChallengeResponses(
  challengeId: string,
  ownerUid: string | null,
  challengeCreatorId: string,
  onData: (responses: SecretResponse[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  if (!isValidFirestoreId(challengeId) || !isValidFirestoreId(challengeCreatorId)) {
    onData([]);
    return () => {};
  }
  const path = `challenges/${challengeId}/responses`;
  const isOwner = Boolean(ownerUid && ownerUid === challengeCreatorId);
  const q = isOwner
    ? query(
        collection(db, 'challenges', challengeId, 'responses'),
        where('creatorId', '==', challengeCreatorId),
        limit(80)
      )
    : query(
        collection(db, 'challenges', challengeId, 'responses'),
        where('isShowcased', '==', true),
        limit(40)
      );

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => ({
        ...(d.data() as Omit<SecretResponse, 'id'>),
        id: d.id,
      }));
      onData(sortByCreatedAtDesc(rows));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeAdminAllChallenges(
  onData: (challenges: Challenge[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'challenges'), limit(120));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ ...(d.data() as Challenge), id: d.id }));
      onData(sortByCreatedAtDesc(rows));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'challenges (admin)');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeAdminAllVotes(
  onData: (votes: VoteRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collectionGroup(db, 'votes'), limit(150));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => ({
        ...(d.data() as Omit<VoteRecord, 'id'>),
        id: d.id,
      }));
      onData(sortByCreatedAtDesc(rows));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'votes collectionGroup (admin)');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeAdminAllResponses(
  onData: (responses: SecretResponse[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collectionGroup(db, 'responses'), limit(120));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => ({
        ...(d.data() as Omit<SecretResponse, 'id'>),
        id: d.id,
      }));
      onData(sortByCreatedAtDesc(rows));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'responses collectionGroup (admin)');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeAdminAllProfiles(
  onData: (profiles: PublicProfile[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'profiles'), limit(120));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => d.data() as PublicProfile);
      onData(sortByCreatedAtDesc(rows));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'profiles (admin)');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

