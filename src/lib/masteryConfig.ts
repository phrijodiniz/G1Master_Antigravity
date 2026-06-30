export interface TopicNode {
  id: string;
  name: string;
  category: 'Foundational Pass-Triggers' | 'Complex Road Operations' | 'Demerit & Penalty Zones' | 'Official Registry Simulator';
  dbChapters: string[]; // Mapped chapters in questions table
  image: string; // Path to thumbnail image
  icon: string; // Backup Lucide icon name
  questionCount: number; // Number of questions in this test level
  questionStartIndex: number; // Offset to slice questions from the chapter pool
}

export interface CategoryInfo {
  name: 'Foundational Pass-Triggers' | 'Complex Road Operations' | 'Demerit & Penalty Zones' | 'Official Registry Simulator';
  unitNumber: number;
  subtitle: string;
  totalQuestionsLabel: string;
}

export const categoryMeta: Record<string, CategoryInfo> = {
  'Foundational Pass-Triggers': {
    name: 'Foundational Pass-Triggers',
    unitNumber: 1,
    subtitle: 'Lock in the foundational laws, signs, and basic controls. These are the absolute must-know questions that form the backbone of the Ontario G1 test.',
    totalQuestionsLabel: '140 questions'
  },
  'Complex Road Operations': {
    name: 'Complex Road Operations',
    unitNumber: 2,
    subtitle: 'Master right-of-way rules, multi-lane intersections, highway lane changes, and situational road rules that cause 84% of applicant failures.',
    totalQuestionsLabel: '290 questions'
  },
  'Demerit & Penalty Zones': {
    name: 'Demerit & Penalty Zones',
    unitNumber: 3,
    subtitle: 'Conquer demerit points, alcohol limits, emergency handling, and licensing restrictions. Clear the legal gotchas that carry immediate failure triggers.',
    totalQuestionsLabel: '60 questions'
  },
  'Official Registry Simulator': {
    name: 'Official Registry Simulator',
    unitNumber: 4,
    subtitle: 'The final hurdle. A hyper-realistic, timed mock exam matching the MTO interface, randomizing 40 questions under official passing scoring rules.',
    totalQuestionsLabel: '40 questions'
  }
};

export const masteryTopics: TopicNode[] = [
  // Unit 1: Foundational Pass-Triggers (140 questions total)
  {
    id: 'essentials_test_1',
    name: 'G1 Practice Test 1',
    category: 'Foundational Pass-Triggers',
    dbChapters: ['Traffic Signs', 'Traffic Lights', 'Pavement Markings', 'Getting Ready to Drive'],
    image: '/mastery_test_1.png',
    icon: 'ShieldCheck',
    questionCount: 20,
    questionStartIndex: 0
  },
  {
    id: 'essentials_test_2',
    name: 'G1 Practice Test 2',
    category: 'Foundational Pass-Triggers',
    dbChapters: ['Traffic Signs', 'Traffic Lights', 'Pavement Markings', 'Getting Ready to Drive'],
    image: '/mastery_test_2.png',
    icon: 'Map',
    questionCount: 40,
    questionStartIndex: 20
  },
  {
    id: 'essentials_test_3',
    name: 'G1 Practice Test 3',
    category: 'Foundational Pass-Triggers',
    dbChapters: ['Traffic Signs', 'Traffic Lights', 'Pavement Markings', 'Getting Ready to Drive'],
    image: '/mastery_test_3.png',
    icon: 'Compass',
    questionCount: 40,
    questionStartIndex: 60
  },
  {
    id: 'essentials_test_4',
    name: 'G1 Practice Test 4',
    category: 'Foundational Pass-Triggers',
    dbChapters: ['Traffic Signs', 'Traffic Lights', 'Pavement Markings', 'Getting Ready to Drive'],
    image: '/mastery_test_4.png',
    icon: 'Award',
    questionCount: 40,
    questionStartIndex: 100
  },

  // Unit 2: Complex Road Operations (290 questions total)
  {
    id: 'complicated_test_1',
    name: 'G1 Practice Test 5',
    category: 'Complex Road Operations',
    dbChapters: [
      'Driving Through Intersections',
      'Changing Directions',
      'Changing Positions',
      'Freeway Driving',
      'Driving Along',
      'Driving at Night and in Bad Weather',
      'Driving Efficiently'
    ],
    image: '/mastery_test_5.png',
    icon: 'GitBranch',
    questionCount: 40,
    questionStartIndex: 0
  },
  {
    id: 'complicated_test_2',
    name: 'G1 Road Rules Test',
    category: 'Complex Road Operations',
    dbChapters: [
      'Driving Through Intersections',
      'Changing Directions',
      'Changing Positions',
      'Freeway Driving',
      'Driving Along',
      'Driving at Night and in Bad Weather',
      'Driving Efficiently'
    ],
    image: '/mastery_test_6.png',
    icon: 'Gauge',
    questionCount: 50,
    questionStartIndex: 40
  },
  {
    id: 'complicated_test_3',
    name: '200-Question G1 Test',
    category: 'Complex Road Operations',
    dbChapters: [
      'Driving Through Intersections',
      'Changing Directions',
      'Changing Positions',
      'Freeway Driving',
      'Driving Along',
      'Driving at Night and in Bad Weather',
      'Driving Efficiently'
    ],
    image: '/mastery_test_7.png',
    icon: 'Zap',
    questionCount: 200,
    questionStartIndex: 90
  },

  // Unit 3: Demerit & Penalty Zones (60 questions total)
  {
    id: 'trouble_test_1',
    name: 'G1 Practice Test 6',
    category: 'Demerit & Penalty Zones',
    dbChapters: [
      'Sharing the Road with Others',
      'Stopping',
      'Dealing with Emergencies',
      'Dealing with Particular Situations',
      'Parking Along Roadways',
      "Keeping Your Driver's Licence",
      'Your Vehicle'
    ],
    image: '/mastery_test_4.png',
    icon: 'AlertTriangle',
    questionCount: 20,
    questionStartIndex: 0
  },
  {
    id: 'trouble_test_2',
    name: 'Safety & Emergencies Test',
    category: 'Demerit & Penalty Zones',
    dbChapters: [
      'Sharing the Road with Others',
      'Stopping',
      'Dealing with Emergencies',
      'Dealing with Particular Situations',
      'Parking Along Roadways',
      "Keeping Your Driver's Licence",
      'Your Vehicle'
    ],
    image: '/mastery_test_6.png',
    icon: 'FileWarning',
    questionCount: 20,
    questionStartIndex: 20
  },
  {
    id: 'trouble_test_3',
    name: 'Licence & Vehicle Regulations',
    category: 'Demerit & Penalty Zones',
    dbChapters: [
      'Sharing the Road with Others',
      'Stopping',
      'Dealing with Emergencies',
      'Dealing with Particular Situations',
      'Parking Along Roadways',
      "Keeping Your Driver's Licence",
      'Your Vehicle'
    ],
    image: '/mastery_test_2.png',
    icon: 'ShieldAlert',
    questionCount: 20,
    questionStartIndex: 40
  },

  // Unit 4: Final Simulation Test
  {
    id: 'final_simulation',
    name: 'Final Exam Simulation',
    category: 'Official Registry Simulator',
    dbChapters: [],
    image: '/mastery_test_simulation.png',
    icon: 'Trophy',
    questionCount: 40,
    questionStartIndex: 0
  }
];

export interface TopicProgress {
  topicId: string;
  attempted: number;
  correct: number;
  rulesAttempted: number;
  rulesCorrect: number;
  signsAttempted: number;
  signsCorrect: number;
}

export type NodeState = 'mastered' | 'in-progress' | 'available' | 'premium-locked' | 'blocked';

export function isTopicPassed(topic: TopicNode, progress: TopicProgress | undefined): boolean {
  if (!progress) return false;
  if (topic.id === 'final_simulation') {
    return progress.correct > 0;
  }
  const attempted = progress.attempted;
  const correct = progress.correct;
  
  // Consider passed/mastered if they completed at least 80% of the questions with >= 80% accuracy
  const minRequiredAttempts = Math.round(topic.questionCount * 0.8);
  return attempted >= minRequiredAttempts && (correct / attempted) >= 0.8;
}

export function getTopicState(
  topic: TopicNode,
  allProgress: Record<string, TopicProgress>,
  isPremium: boolean
): NodeState {
  const topicIndex = masteryTopics.findIndex((t) => t.id === topic.id);
  const progress = allProgress[topic.id];
  const attempted = progress?.attempted ?? 0;
  const correct = progress?.correct ?? 0;

  // 1. Free vs Premium check
  // Free users can take all tests 1, 2, 3 (index 0, 1, 2). Test 4-11 (index >= 3) is for premium users only.
  if (!isPremium && topicIndex >= 3) {
    return 'premium-locked';
  }

  // 2. Sequential unlocking check:
  // Each test (except the first one) is only enabled if the previous one has an 80%+ mark (passed).
  if (topicIndex > 0) {
    const previousTopic = masteryTopics[topicIndex - 1];
    const previousProgress = allProgress[previousTopic.id];
    if (!isTopicPassed(previousTopic, previousProgress)) {
      return 'blocked';
    }
  }

  // 3. Normal progress checks for the current test
  if (topic.id === 'final_simulation') {
    if (correct > 0) {
      return 'mastered';
    }
    if (attempted > 0) {
      return 'in-progress';
    }
    return 'available';
  }

  // Consider mastered if they completed at least 80% of the questions with >= 80% accuracy
  const minRequiredAttempts = Math.round(topic.questionCount * 0.8);
  if (attempted >= minRequiredAttempts && (correct / attempted) >= 0.8) {
    return 'mastered';
  }

  if (attempted > 0) {
    return 'in-progress';
  }

  return 'available';
}
