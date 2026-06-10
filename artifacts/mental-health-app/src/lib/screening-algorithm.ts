export interface Question {
  id: string;
  text: string;
  weight: number;
  reverseScored?: boolean;
}

export interface Module {
  id: string;
  name: string;
  questions: Question[];
}

export const PHASE_1_QUESTIONS: Question[] = [
  { id: 'mood_netflix', text: "When your brain decides it's Netflix time even when there's actual stuff to do, how often does that happen?", weight: 1.0 },
  { id: 'mood_tabs', text: "How often does your head feel like 37 browser tabs are open and one is playing music but you can't find it?", weight: 1.0 },
  { id: 'mood_tired', text: "Waking up tired even after sleeping a full 8 hours — how often?", weight: 1.2 },
  { id: 'mood_figured_out', text: "How often do you low-key feel like everyone else has life figured out except you?", weight: 1.0 },
  { id: 'mood_future', text: "How often do you actually feel genuinely hyped about your future?", weight: 1.0, reverseScored: true }
];

export const ISSUE_MODULES: Module[] = [
  {
    id: 'academic',
    name: 'Academic Stress',
    questions: [
      { id: 'ac1', text: "Deadlines hitting different lately — like you open your laptop, stare at it, close it, and call that 'starting'?", weight: 1.3 },
      { id: 'ac2', text: "Do you feel like your GPA/grades define your entire worth as a human?", weight: 1.5 },
      { id: 'ac3', text: "How often do you feel completely overwhelmed by the pile of things you need to do?", weight: 1.2 }
    ]
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    questions: [
      { id: 'anx1', text: "Do you ever spiral into worst-case scenarios so fast it scares even you?", weight: 1.5 },
      { id: 'anx2', text: "Random moments of 'something bad is about to happen' for no reason — how common?", weight: 1.4 },
      { id: 'anx3', text: "How often does uncertainty about the future make you physically feel off?", weight: 1.3 }
    ]
  },
  {
    id: 'sleep',
    name: 'Sleep Problems',
    questions: [
      { id: 'slp1', text: "3am doomscrolling that somehow turns into 5am — how often?", weight: 1.2 },
      { id: 'slp2', text: "How often do you lay there unable to sleep because your brain won't shut up?", weight: 1.3 },
      { id: 'slp3', text: "Waking up feeling foggy, groggy, and basically unprocessed — how often?", weight: 1.1 }
    ]
  },
  {
    id: 'burnout',
    name: 'Burnout',
    questions: [
      { id: 'brn1', text: "That feeling where even the things you used to love feel like chores — how often?", weight: 1.4 },
      { id: 'brn2', text: "How often do you feel emotionally drained before the day even starts?", weight: 1.5 },
      { id: 'brn3', text: "How often do you feel disconnected, like you're just going through the motions?", weight: 1.3 }
    ]
  },
  {
    id: 'depression',
    name: 'Depression',
    questions: [
      { id: 'dep1', text: "Low-key feeling like things won't get better no matter what you do — how often?", weight: 1.6 },
      { id: 'dep2', text: "How often do you feel kind of numb — like emotions are buffering but never loading?", weight: 1.5 },
      { id: 'dep3', text: "How often do you find yourself not interested in stuff that used to give you a hit of dopamine?", weight: 1.4 }
    ]
  },
  {
    id: 'imposter',
    name: 'Imposter Syndrome',
    questions: [
      { id: 'imp1', text: "Feeling like a fraud who got lucky and people are about to find out — how often?", weight: 1.3 },
      { id: 'imp2', text: "How often do you downplay your own wins as 'no big deal' or luck?", weight: 1.2 },
      { id: 'imp3', text: "How terrified are you of being exposed as 'not as smart as they think'?", weight: 1.4 }
    ]
  },
  {
    id: 'social',
    name: 'Social Isolation',
    questions: [
      { id: 'soc1', text: "How often do you feel invisible, like you could disappear and nobody would notice for a while?", weight: 1.5 },
      { id: 'soc2', text: "Canceling plans because being around people feels like too much energy — how common?", weight: 1.3 },
      { id: 'soc3', text: "That loneliness-in-a-crowd feeling — surrounded by people but deeply alone — how often?", weight: 1.4 }
    ]
  },
  {
    id: 'selfesteem',
    name: 'Low Self-Esteem',
    questions: [
      { id: 'se1', text: "How often is your inner voice genuinely unkind to you — like your worst critic lives in your head?", weight: 1.4 },
      { id: 'se2', text: "Comparing yourself to others and feeling like you're always the lesser version — how often?", weight: 1.3 },
      { id: 'se3', text: "How much does fear of failing hold you back from even trying?", weight: 1.2 }
    ]
  }
];

export const SAFETY_MODULE: Module = {
  id: 'safety',
  name: 'Safety',
  questions: [
    { id: 'safe1', text: "Have you had thoughts that life isn't really worth it?", weight: 2.0 },
    { id: 'safe2', text: "Do you ever wish you could just disappear for a while?", weight: 1.8 },
    { id: 'safe3', text: "Have you had thoughts about hurting yourself?", weight: 2.5 }
  ]
};

export const LIKERT_OPTIONS = [
  { value: 0, label: "Never" },
  { value: 1, label: "Rarely" },
  { value: 2, label: "Sometimes" },
  { value: 3, label: "Often" },
  { value: 4, label: "Almost Always" }
];

export function calculateScore(answers: Record<string, number>, questions: Question[]) {
  let score = 0;
  for (const q of questions) {
    const val = answers[q.id];
    if (val !== undefined) {
      const finalVal = q.reverseScored ? 4 - val : val;
      score += finalVal * q.weight;
    }
  }
  return score;
}
