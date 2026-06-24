export interface PricingTier {
  id: '2_weeks' | '30_days' | 'lifetime';
  price: string;
  durationLabel: string;
  details: string;
  isPopular?: boolean;
}

export interface ResultsContentConfig {
  sectionsOrder: string[];
  toggles: {
    showStakes: boolean;
    showProof: boolean;
    showWeakestSectionName: boolean;
  };
  pricing: PricingTier[];
  scoreBands: {
    passing: {
      title: string;
      subtitle: string;
      stakesCopy: string;
      benefitsFocus: string;
    };
    borderline: {
      title: string;
      subtitle: string;
      stakesCopy: string;
      benefitsFocus: string;
    };
    failing: {
      title: string;
      subtitle: string;
      stakesCopy: string;
      benefitsFocus: string;
    };
  };
}

export const resultsConfig: ResultsContentConfig = {
  sectionsOrder: ['score', 'readiness', 'stakes', 'benefits', 'proof', 'pricing'],
  toggles: {
    showStakes: true,
    showProof: true,
    showWeakestSectionName: true,
  },
  pricing: [
    {
      id: '2_weeks',
      price: '5.97',
      durationLabel: '2 Weeks Access',
      details: 'Quick study push — ideal for last-minute prep.'
    },
    {
      id: '30_days',
      price: '9.97',
      durationLabel: '1 Month Access',
      details: 'Perfect preparation window — 92% of students choose this tier.',
      isPopular: true
    },
    {
      id: 'lifetime',
      price: '19.97',
      durationLabel: 'Lifetime Access',
      details: 'Best value & absolute guarantee — study at your own pace forever.'
    }
  ],
  scoreBands: {
    passing: {
      title: 'Strong Test Score!',
      subtitle: 'You cleared the 80% passing mark on this practice quiz.',
      stakesCopy: 'A single passing score on a mixed test is a great start—but the real G1 test draws randomly from 700+ questions. If you get unlucky with your random topics on test day, failing means paying the $16 retake fee, sitting through the queues again, and delaying your G2 license countdown.',
      benefitsFocus: 'Unlimited G1 simulator mock exams to build bulletproof consistency, ensuring your passing average holds on any randomized question draw.'
    },
    borderline: {
      title: 'Close, But Not Ready Yet',
      subtitle: 'You are right on the borderline. A few wrong answers will fail you on the real test.',
      stakesCopy: 'Being borderline is high-risk. In Ontario, if you fail either the Rules or the Signs section separately, you fail the whole test. Failing means a $16 retake fee, booking delays of up to 4 weeks, and having to coordinate rides back to the DriveTest center.',
      benefitsFocus: 'Targeted topic quizzes and category deep-dives to turn your borderline weak spots into guaranteed passes.'
    },
    failing: {
      title: 'Not Test Ready Today',
      subtitle: 'Your scores indicate critical blindspots that will result in a G1 exam failure.',
      stakesCopy: 'Failing the official G1 is a major hassle. It costs $16.00 per attempt, but the real cost is the weeks of delays, the frustration of sitting in waiting rooms, and the delay to your G2 license clock. Do not book your DriveTest until your practice scores are safely above 80%.',
      benefitsFocus: 'Access to the full 700+ question bank and interactive topic checklists to systematically patch your knowledge gaps.'
    }
  }
};
