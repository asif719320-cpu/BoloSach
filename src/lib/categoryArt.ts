import heroArenaImg from '../assets/images/bolosach_hero_arena_1795351767909.jpg';
import chaiMehfilImg from '../assets/images/topic_chai_mehfil_1795352435483.jpg';
import cricketStadiumImg from '../assets/images/topic_cricket_stadium_1795352435562.jpg';
import squadDebateImg from '../assets/images/topic_squad_debate_1795352435618.jpg';
import { ChallengeCategory } from '../types/bolosach';

export interface CategoryArtwork {
  imageUrl: string;
  alt: string;
  gradientClass: string;
}

export const CATEGORY_ARTWORK: Record<ChallengeCategory, CategoryArtwork> = {
  cricket: {
    imageUrl: cricketStadiumImg,
    alt: 'Sunlit cricket pitch and leather ball',
    gradientClass: 'from-emerald-950 via-emerald-900 to-neutral-950',
  },
  poetry: {
    imageUrl: chaiMehfilImg,
    alt: 'Steaming cups of chai with poetry notebook',
    gradientClass: 'from-amber-950 via-stone-900 to-neutral-950',
  },
  friendship: {
    imageUrl: chaiMehfilImg,
    alt: 'Friends sharing chai table conversation',
    gradientClass: 'from-stone-900 via-emerald-950 to-neutral-950',
  },
  roast: {
    imageUrl: squadDebateImg,
    alt: 'Minimalist ceramic chess pieces facing off',
    gradientClass: 'from-orange-950 via-neutral-900 to-neutral-950',
  },
  debate: {
    imageUrl: squadDebateImg,
    alt: 'Two sculptural pieces in studio lighting',
    gradientClass: 'from-neutral-950 via-emerald-950 to-orange-950',
  },
  general: {
    imageUrl: heroArenaImg,
    alt: 'BoloSach studio duel screens',
    gradientClass: 'from-neutral-900 via-neutral-800 to-neutral-950',
  },
};
