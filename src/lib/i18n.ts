import { ChallengeCategory, ChallengeType, LangCode, SecretMoodTag } from '../types/bolosach';

export interface Translations {
  brand: string;
  navFeed: string;
  navBattles: string;
  navSecrets: string;
  navStudio: string;
  createCta: string;
  signInCta: string;
  signOutCta: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryBtn: string;
  heroSecondaryBtn: string;
  howItWorksTitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  allCategories: string;
  sortNewest: string;
  sortTrending: string;
  noChallengesTitle: string;
  noChallengesDesc: string;
  launchFirstBtn: string;
  voteRecorded: string;
  secretRecorded: string;
  viralPromptTitle: string;
  viralPromptDesc: string;
  createMyOwnBtn: string;
  oneClickHint: string;
  shareWhatsApp: string;
  shareAppBtn: string;
  inviteFriendsTitle: string;
  inviteFriendsDesc: string;
  copyAppLink: string;
  appLinkCopied: string;
  copyLink: string;
  copied: string;
  downloadCard: string;
  openArena: string;
  votesLabel: string;
  truthsLabel: string;
  closedBadge: string;
  activeBadge: string;
  sendSecretPlaceholder: string;
  sendSecretBtn: string;
  moodPrompt: string;
  showcasedTruths: string;
  noShowcasedYet: string;
  createModalTitle: string;
  modeBattle: string;
  modeBattleDesc: string;
  modeFriendPoll: string;
  modeFriendPollDesc: string;
  modeSecretPoll: string;
  modeSecretPollDesc: string;
  fieldCategory: string;
  fieldQuestion: string;
  fieldSideA: string;
  fieldSideB: string;
  sidePhotosTitle: string;
  sidePhotosHint: string;
  uploadPhotoA: string;
  uploadPhotoB: string;
  changePhoto: string;
  removePhoto: string;
  processingPhoto: string;
  optionABadge: string;
  optionBBadge: string;
  fieldVisibility: string;
  visPublic: string;
  visUnlisted: string;
  quickTemplates: string;
  publishBtn: string;
  publishing: string;
  studioTitle: string;
  studioSubtitle: string;
  signInPromptTitle: string;
  signInPromptDesc: string;
  continueGoogle: string;
  profileSettings: string;
  displayNameLabel: string;
  handleLabel: string;
  bioLabel: string;
  saveProfile: string;
  profileSaved: string;
  myChallengesTitle: string;
  secretInboxTitle: string;
  noSecretsInbox: string;
  showcaseToggle: string;
  hideFromCard: string;
  replyPlaceholder: string;
  saveReply: string;
  closeChallenge: string;
  reopenChallenge: string;
  deleteChallenge: string;
  confirmDelete: string;
  backToFeed: string;
  notFoundTitle: string;
  notFoundDesc: string;
  leaderboardTitle: string;
  feedbackTitle: string;
  feedbackDesc: string;
  feedbackEmailLabel: string;
  feedbackEmailPlaceholder: string;
  feedbackMessageLabel: string;
  feedbackMessagePlaceholder: string;
  feedbackSubmit: string;
  feedbackSending: string;
  feedbackSent: string;
  typeLabels: Record<ChallengeType, string>;
  categoryLabels: Record<ChallengeCategory, string>;
  moodLabels: Record<SecretMoodTag, string>;
}

export const COPY: Record<LangCode, Translations> = {
  en: {
    brand: 'BoloSach',
    navFeed: 'Feed',
    navBattles: '1v1 Battles',
    navSecrets: 'Secret Polls',
    navStudio: 'My Studio',
    createCta: 'Create Challenge',
    signInCta: 'Sign In',
    signOutCta: 'Sign Out',
    heroTitle: 'Challenge friends, settle debates, hear the honest truth.',
    heroSubtitle:
      'Build a 1v1 friend battle or anonymous BoloSach poll in 10 seconds. Share one link on WhatsApp — friends vote in 1 click without signing up.',
    heroPrimaryBtn: 'Start a 1v1 Battle',
    heroSecondaryBtn: 'Ask Secret Truths',
    howItWorksTitle: 'The Viral Loop',
    step1Title: '01. Pick a Battle or Secret Poll',
    step1Desc: 'Set two sides for a 1v1 clash or open an anonymous question box.',
    step2Title: '02. Drop Link on WhatsApp',
    step2Desc: 'Share your card straight to WhatsApp Status or friend groups.',
    step3Title: '03. Watch Live Votes Roll In',
    step3Desc: 'Friends vote in 1 tap. Reply and showcase your favorite truths.',
    allCategories: 'All Topics',
    sortNewest: 'Latest',
    sortTrending: 'Top Voted',
    noChallengesTitle: 'No challenges live in this feed yet',
    noChallengesDesc:
      'Be the first to launch a 1v1 friend battle or anonymous BoloSach poll and share it with your squad.',
    launchFirstBtn: 'Create First Challenge',
    voteRecorded: 'Your vote is locked in',
    secretRecorded: 'Anonymous truth delivered safely',
    viralPromptTitle: 'Your turn — challenge your own friends',
    viralPromptDesc:
      'Make your own 1v1 battle or secret truth box in 10 seconds and drop it on your WhatsApp Status.',
    createMyOwnBtn: 'Create My Challenge',
    oneClickHint: '1-click vote · No account required to vote',
    shareWhatsApp: 'Share on WhatsApp',
    shareAppBtn: 'Share App',
    inviteFriendsTitle: 'Invite Friends to BoloSach',
    inviteFriendsDesc:
      'Send the app link on WhatsApp so friends can open BoloSach and build their own 1v1 photo battles & secret polls.',
    copyAppLink: 'Copy App Link',
    appLinkCopied: 'App Link Copied!',
    copyLink: 'Copy Link',
    copied: 'Link Copied',
    downloadCard: 'Status Card',
    openArena: 'Open Arena',
    votesLabel: 'votes',
    truthsLabel: 'truths',
    closedBadge: 'Closed',
    activeBadge: 'Live',
    sendSecretPlaceholder: 'Write an honest truth, compliment, or roast anonymously...',
    sendSecretBtn: 'Send Anonymous Truth',
    moodPrompt: 'Tone',
    showcasedTruths: 'Showcased Replies',
    noShowcasedYet: 'No replies showcased publicly yet.',
    createModalTitle: 'Launch a New Challenge',
    modeBattle: '1v1 Battle',
    modeBattleDesc: 'Two rivals or options go head-to-head',
    modeFriendPoll: 'Friend Poll',
    modeFriendPollDesc: 'Ask the group who fits best',
    modeSecretPoll: 'Secret Poll',
    modeSecretPollDesc: 'Anonymous truths only you can read',
    fieldCategory: 'Topic',
    fieldQuestion: 'Your Question or Challenge',
    fieldSideA: 'Option A Name / Label',
    fieldSideB: 'Option B Name / Label',
    sidePhotosTitle: 'Option A vs Option B Photos (Optional)',
    sidePhotosHint: 'Add photos of both people or options so friends can tap a picture to vote.',
    uploadPhotoA: 'Add Photo A',
    uploadPhotoB: 'Add Photo B',
    changePhoto: 'Change',
    removePhoto: 'Remove',
    processingPhoto: 'Optimizing...',
    optionABadge: 'Option A',
    optionBBadge: 'Option B',
    fieldVisibility: 'Where should this appear?',
    visPublic: 'Public Feed + Link',
    visUnlisted: 'WhatsApp Link Only',
    quickTemplates: 'Quick Starter Ideas',
    publishBtn: 'Publish Challenge',
    publishing: 'Publishing...',
    studioTitle: 'Creator Studio',
    studioSubtitle: 'Manage your live battles, read secret truths, and update your profile.',
    signInPromptTitle: 'Sign in to run your BoloSach Studio',
    signInPromptDesc:
      'Create 1v1 battles, unlock your private anonymous inbox, and showcase replies to WhatsApp.',
    continueGoogle: 'Continue with Google',
    profileSettings: 'Profile Settings',
    displayNameLabel: 'Display Name',
    handleLabel: 'Public Handle',
    bioLabel: 'Short Bio',
    saveProfile: 'Save Profile',
    profileSaved: 'Profile updated',
    myChallengesTitle: 'Your Challenges',
    secretInboxTitle: 'Secret Truths Inbox',
    noSecretsInbox: 'No anonymous truths received for this challenge yet. Share the link on WhatsApp!',
    showcaseToggle: 'Showcase Reply',
    hideFromCard: 'Hide Reply',
    replyPlaceholder: 'Write a public reply to showcase...',
    saveReply: 'Post Reply',
    closeChallenge: 'Close Voting',
    reopenChallenge: 'Reopen',
    deleteChallenge: 'Delete',
    confirmDelete: 'Tap again to confirm delete',
    backToFeed: 'Back to All Challenges',
    notFoundTitle: 'Challenge not found',
    notFoundDesc: 'This link may have expired or been removed by its creator.',
    leaderboardTitle: 'Active Topics',
    feedbackTitle: 'Report an Issue or Comment',
    feedbackDesc:
      'Facing any issue or have feedback? Leave your Gmail and comment — only the BoloSach admin can read it.',
    feedbackEmailLabel: 'Your Gmail Address',
    feedbackEmailPlaceholder: 'example@gmail.com',
    feedbackMessageLabel: 'Your Issue or Comment',
    feedbackMessagePlaceholder: 'Describe what issue you are facing...',
    feedbackSubmit: 'Send to Admin',
    feedbackSending: 'Sending...',
    feedbackSent: 'Your comment has been sent to the admin!',
    typeLabels: {
      battle: '1v1 Battle',
      friend_poll: 'Friend Poll',
      secret_poll: 'Secret Poll',
    },
    categoryLabels: {
      cricket: 'Cricket',
      poetry: 'Poetry & Shayari',
      friendship: 'Friendship',
      roast: 'Friendly Roast',
      debate: 'Hot Debate',
      general: 'General',
    },
    moodLabels: {
      honest: 'Honest',
      funny: 'Funny',
      spicy: 'Spicy',
      kind: 'Kind',
    },
  },
  ur: {
    brand: 'BoloSach',
    navFeed: 'فیڈ',
    navBattles: '1v1 مقابلے',
    navSecrets: 'خفیہ پولز',
    navStudio: 'میرا اسٹوڈیو',
    createCta: 'نیا چیلنج',
    signInCta: 'لاگ ان',
    signOutCta: 'لاگ آؤٹ',
    heroTitle: 'دوستوں کو چیلنج کریں، مقابلہ جیتیں، اور سچ سنیں۔',
    heroSubtitle:
      'صرف 10 سیکنڈ میں اپنا 1v1 مقابلہ یا خفیہ سوال بنائیں۔ WhatsApp اسٹیٹس پر لنک لگائیں — دوست بغیر اکاؤنٹ بنائے 1 کلک میں ووٹ دیں گے۔',
    heroPrimaryBtn: '1v1 مقابلہ بنائیں',
    heroSecondaryBtn: 'خفیہ رائے پوچھیں',
    howItWorksTitle: 'وائرل طریقہ کار',
    step1Title: '01. مقابلہ یا خفیہ سوال بنائیں',
    step1Desc: 'دو آپشنز والا 1v1 چیلنج چنیں یا خفیہ جوابات کا باکس کھولیں۔',
    step2Title: '02. WhatsApp پر شیئر کریں',
    step2Desc: 'اپنے دوستوں کے گروپ یا اسٹیٹس پر لنک اور کارڈ بھیجیں۔',
    step3Title: '03. لائیو ووٹس اور سچ دیکھیں',
    step3Desc: 'دوست فوراً ووٹ دیں گے اور آپ بہترین جوابات نمایاں کر سکتے ہیں۔',
    allCategories: 'تمام موضوعات',
    sortNewest: 'تازہ ترین',
    sortTrending: 'سب سے زیادہ ووٹ',
    noChallengesTitle: 'اس فیڈ میں ابھی کوئی چیلنج موجود نہیں',
    noChallengesDesc:
      'پہلا 1v1 مقابلہ یا خفیہ سوال بنائیں اور اپنے دوستوں کے ساتھ WhatsApp پر شیئر کریں۔',
    launchFirstBtn: 'پہلا چیلنج بنائیں',
    voteRecorded: 'آپ کا ووٹ درج ہو گیا ہے',
    secretRecorded: 'آپ کا خفیہ پیغام محفوظ طریقے سے پہنچ گیا',
    viralPromptTitle: 'اب آپ کی باری — دوستوں کو چیلنج کریں',
    viralPromptDesc:
      '10 سیکنڈ میں اپنا 1v1 مقابلہ یا خفیہ پول بنائیں اور WhatsApp اسٹیٹس پر لگائیں۔',
    createMyOwnBtn: 'اپنا چیلنج بنائیں',
    oneClickHint: '1 کلک ووٹ · ووٹ دینے کے لیے لاگ ان ضروری نہیں',
    shareWhatsApp: 'WhatsApp شیئر',
    shareAppBtn: 'ایپ شیئر کریں',
    inviteFriendsTitle: 'دوستوں کو BoloSach پر بلائیں',
    inviteFriendsDesc:
      'اپنے دوستوں کو ایپ کا لنک WhatsApp پر بھیجیں تاکہ وہ بھی ایپ کھول کر اپنے 1v1 فوٹو مقابلے اور خفیہ پولز بنا سکیں۔',
    copyAppLink: 'ایپ لنک کاپی کریں',
    appLinkCopied: 'ایپ لنک کاپی ہو گیا!',
    copyLink: 'لنک کاپی کریں',
    copied: 'لنک کاپی ہو گیا',
    downloadCard: 'اسٹیٹس کارڈ',
    openArena: 'مقابلہ کھولیں',
    votesLabel: 'ووٹس',
    truthsLabel: 'جوابات',
    closedBadge: 'بند',
    activeBadge: 'لائیو',
    sendSecretPlaceholder: 'اپنی سچی رائے، تعریف یا دلچسپ بات خفیہ طور پر لکھیں...',
    sendSecretBtn: 'خفیہ سچ بھیجیں',
    moodPrompt: 'انداز',
    showcasedTruths: 'نمایاں جوابات',
    noShowcasedYet: 'ابھی تک کوئی جواب عوامی طور پر نمایاں نہیں کیا گیا۔',
    createModalTitle: 'نیا چیلنج شروع کریں',
    modeBattle: '1v1 مقابلہ',
    modeBattleDesc: 'دو دوستوں یا آپشنز کے درمیان ووٹنگ',
    modeFriendPoll: 'دوستوں کا پول',
    modeFriendPollDesc: 'گروپ سے پوچھیں کون بہتر ہے',
    modeSecretPoll: 'خفیہ پول (بولو سچ)',
    modeSecretPollDesc: 'خفیہ جوابات جو صرف آپ دیکھ سکیں',
    fieldCategory: 'موضوع',
    fieldQuestion: 'آپ کا سوال یا چیلنج',
    fieldSideA: 'آپشن A (پہلے بندے کا نام)',
    fieldSideB: 'آپشن B (دوسرے بندے کا نام)',
    sidePhotosTitle: 'آپشن A اور آپشن B کی تصاویر لگائیں (اختیاری)',
    sidePhotosHint: 'دونوں بندوں یا آپشنز کی تصویر لگائیں تاکہ دوست تصویر دیکھ کر ووٹ دیں۔',
    uploadPhotoA: 'تصویر A لگائیں',
    uploadPhotoB: 'تصویر B لگائیں',
    changePhoto: 'تبدیل کریں',
    removePhoto: 'ہٹائیں',
    processingPhoto: 'تیار ہو رہی ہے...',
    optionABadge: 'آپشن A',
    optionBBadge: 'آپشن B',
    fieldVisibility: 'یہ کہاں نظر آئے؟',
    visPublic: 'عوامی فیڈ + لنک',
    visUnlisted: 'صرف WhatsApp لنک',
    quickTemplates: 'تیار آئیڈیاز',
    publishBtn: 'چیلنج شائع کریں',
    publishing: 'شائع ہو رہا ہے...',
    studioTitle: 'کری ایٹر اسٹوڈیو',
    studioSubtitle: 'اپنے مقابلے دیکھیں، خفیہ پیغامات پڑھیں اور پروفائل اپڈیٹ کریں۔',
    signInPromptTitle: 'اپنا BoloSach اسٹوڈیو کھولنے کے لیے لاگ ان کریں',
    signInPromptDesc:
      'اپنے 1v1 مقابلے بنائیں، خفیہ ان باکس کھولیں اور بہترین جوابات WhatsApp پر شیئر کریں۔',
    continueGoogle: 'Google سے لاگ ان کریں',
    profileSettings: 'پروفائل سیٹنگز',
    displayNameLabel: 'نام',
    handleLabel: 'یوزر ہینڈل',
    bioLabel: 'مختصر تعارف',
    saveProfile: 'محفوظ کریں',
    profileSaved: 'پروفائل محفوظ ہو گئی',
    myChallengesTitle: 'آپ کے چیلنجز',
    secretInboxTitle: 'خفیہ جوابات کا ان باکس',
    noSecretsInbox: 'اس چیلنج پر ابھی کوئی خفیہ پیغام نہیں آیا۔ لنک WhatsApp پر شیئر کریں!',
    showcaseToggle: 'کارڈ پر دکھائیں',
    hideFromCard: 'چھپائیں',
    replyPlaceholder: 'عوامی جواب لکھیں...',
    saveReply: 'جواب محفوظ کریں',
    closeChallenge: 'ووٹنگ بند کریں',
    reopenChallenge: 'دوبارہ کھولیں',
    deleteChallenge: 'حذف کریں',
    confirmDelete: 'تصدیق کے لیے دوبارہ دبائیں',
    backToFeed: 'تمام چیلنجز پر واپس جائیں',
    notFoundTitle: 'چیلنج نہیں ملا',
    notFoundDesc: 'ہو سکتا ہے یہ لنک ختم ہو گیا ہو یا بنانے والے نے حذف کر دیا ہو۔',
    leaderboardTitle: 'موضوعات',
    feedbackTitle: 'مسئلہ بتائیں / ایڈمن کو کمنٹ کریں',
    feedbackDesc:
      'اگر ایپ چلانے میں کوئی مسئلہ یا پریشانی آ رہی ہے تو اپنی جی میل اور کمنٹ لکھیں — یہ صرف ایڈمن دیکھ سکتا ہے۔',
    feedbackEmailLabel: 'آپ کی جی میل (Gmail)',
    feedbackEmailPlaceholder: 'example@gmail.com',
    feedbackMessageLabel: 'اپنا مسئلہ یا کمنٹ لکھیں',
    feedbackMessagePlaceholder: 'بتائیں کہ آپ کو کیا مسئلہ آ رہا ہے...',
    feedbackSubmit: 'ایڈمن کو کمنٹ بھیجیں',
    feedbackSending: 'بھیجا جا رہا ہے...',
    feedbackSent: 'آپ کا کمنٹ ایڈمن تک پہنچ گیا ہے!',
    typeLabels: {
      battle: '1v1 مقابلہ',
      friend_poll: 'فرینڈ پول',
      secret_poll: 'خفیہ پول',
    },
    categoryLabels: {
      cricket: 'کرکٹ',
      poetry: 'شاعری',
      friendship: 'دوستی',
      roast: 'ہنسی مذاق',
      debate: 'بحث',
      general: 'عام',
    },
    moodLabels: {
      honest: 'سچ',
      funny: 'مزاحیہ',
      spicy: 'تیکھا',
      kind: 'پیارا',
    },
  },
};

export interface StarterTemplate {
  type: ChallengeType;
  category: ChallengeCategory;
  titleEn: string;
  titleUr: string;
  sideAEn: string;
  sideBEn: string;
  sideAUr: string;
  sideBUr: string;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    type: 'battle',
    category: 'cricket',
    titleEn: 'Better under pressure in a chase?',
    titleUr: 'پریشر میچ میں کون بہتر کھیلتا ہے؟',
    sideAEn: 'Babar Azam',
    sideBEn: 'Virat Kohli',
    sideAUr: 'بابر اعظم',
    sideBUr: 'ویرات کوہلی',
  },
  {
    type: 'friend_poll',
    category: 'friendship',
    titleEn: 'Who never pays the chai bill on time in our squad?',
    titleUr: 'ہمارے گروپ میں چائے کا بل دینے سے کون بھاگتا ہے؟',
    sideAEn: 'Always makes excuses',
    sideBEn: 'Secretly rich',
    sideAUr: 'بہانے باز',
    sideBUr: 'چھپا رستم',
  },
  {
    type: 'secret_poll',
    category: 'roast',
    titleEn: 'Tell me one honest thing about me you never said to my face!',
    titleUr: 'میرے بارے میں ایک سچی بات بتاؤ جو آج تک منہ پر نہیں کہی!',
    sideAEn: 'Respect the honesty',
    sideBEn: 'Too spicy',
    sideAUr: 'سچ کڑوا ہے',
    sideBUr: 'بہت تیکھا',
  },
  {
    type: 'battle',
    category: 'poetry',
    titleEn: 'Midnight mood: Poetry or Lo-fi Chai?',
    titleUr: 'رات کے 2 بجے کیا بہتر ہے: شاعری یا کڑک چائے؟',
    sideAEn: 'Urdu Shayari',
    sideBEn: 'Karak Chai',
    sideAUr: 'اردو شاعری',
    sideBUr: 'کڑک چائے',
  },
];
