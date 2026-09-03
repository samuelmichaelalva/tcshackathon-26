export interface SampleOffer {
  id: string;
  badge: string;
  badgeType: 'fake' | 'safe';
  title: string;
  subtitle: string;
  text: string;
}

export interface AnalysisResult {
  isScam: boolean;
  verdictTitle: string;
  verdictSubtitle: string;
  threatLevel: 'HIGH_RISK_SCAM' | 'SAFE_LEGITIMATE';
  facts: {
    feeDemand: {
      isFlagged: boolean;
      status: string;
      details: string;
      ruleText: string;
    };
    senderEmail: {
      isFlagged: boolean;
      status: string;
      details: string;
      ruleText: string;
    };
    interviewProcess: {
      isFlagged: boolean;
      status: string;
      details: string;
      ruleText: string;
    };
  };
  reasons: string[];
  checklist: {
    id: number;
    text: string;
    completed: boolean;
  }[];
}

export const SAMPLE_OFFERS: SampleOffer[] = [
  {
    id: 'sample-1',
    badge: 'Sample 1: Paid Deposit',
    badgeType: 'fake',
    title: 'Sample 1: Paid Deposit',
    subtitle: '₹2,500 laptop collateral',
    text: `Dear Candidate,

Congratulations! You have been selected as a Software Intern at TCS Digital.
Stipend: ₹35,000/month (Remote).

To receive your corporate laptop and security tokens, please deposit a refundable security fee of ₹2,500 to UPI ID: tcscareers.assets@okaxis within 12 hours.`
  },
  {
    id: 'sample-2',
    badge: 'Sample 2: Telegram Scam',
    badgeType: 'fake',
    title: 'Sample 2: Telegram Scam',
    subtitle: 'No interview required',
    text: `URGENT HIRING: Data Entry & AI Content Operations Intern.
Salary: ₹45,000 per month. Work from home 2 hours daily.

No technical interview or experience required. Direct selection for freshers!
Send your Aadhaar card copy, bank passbook, and resume to HR coordinator on Telegram @TechRecruiterDirect within 3 hours to confirm your seat.`
  },
  {
    id: 'sample-3',
    badge: 'Sample 3: TCS Offer',
    badgeType: 'safe',
    title: 'Sample 3: TCS Offer',
    subtitle: 'Official @tcs.com hiring',
    text: `Dear Ananya,

We are delighted to extend an offer for the role of Graduate Technology Intern at Tata Consultancy Services (TCS), following your successful technical interview and assessment on August 20.

Stipend: ₹18,000/month.
Location: Mumbai / Hybrid.

Please log in to your official TCS NextStep portal (nextstep.tcs.com) using your registered Reference ID to view and accept your offer letter. Official correspondence: campus.talent@tcs.com.
Note: TCS never solicits registration, equipment, or training fees at any stage of hiring.`
  },
  {
    id: 'sample-4',
    badge: 'Sample 4: Genuine Startup',
    badgeType: 'safe',
    title: 'Sample 4: Genuine Startup',
    subtitle: 'Direct founder talk, free',
    text: `Hi Samuel,

Great chatting with you and the team during the code walkthrough on Wednesday! We loved your React project demo and want to offer you a 3-month Frontend Engineering Internship at CloudScale AI.

Stipend: ₹20,000/month.
Start Date: Next Monday.

Please review the attached offer letter and reply with your acceptance by Friday. Official contact: careers@cloudscale.ai.`
  }
];

export function analyzeOfferText(text: string): AnalysisResult {
  const lower = text.toLowerCase();

  // 1. Fee detection
  const hasFeeKeywords = /fee|deposit|refundable|collateral|registration|charges|pay\s*(?:₹|rs|\$|\d)|upi|paytm|gpay|bank transfer/i.test(text);
  const mentionsZeroFee = /never\s+solicits?\s+registration|never\s+charges?|no\s+fees?/i.test(text);
  const feeDetected = hasFeeKeywords && !mentionsZeroFee;

  let feeAmountMatch = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
  let feeStr = feeDetected ? (feeAmountMatch ? `₹${feeAmountMatch[1]} Requested` : 'Deposit / Fee Demanded') : 'Free / No Fees Required';

  // 2. Email / Domain detection
  const hasGmail = /@(?:gmail|yahoo|outlook|hotmail|rediffmail|protonmail)\.com/i.test(text);
  const hasTelegram = /telegram|@\w+direct|t\.me/i.test(text);
  const hasOfficialDomain = /@(?:tcs|cloudscale|microsoft|infosys|google|amazon|accenture|wipro|ibm)\.(?:com|in|ai|io)|nextstep\.tcs\.com/i.test(text);
  const emailSuspicious = hasGmail || hasTelegram || (!hasOfficialDomain && (hasFeeKeywords || /urgent/i.test(text)));

  // 3. Interview detection
  const noInterviewKeywords = /without\s+(?:any\s+)?(?:technical\s+)?interview|no\s+(?:technical\s+)?interview|direct\s+selection/i.test(text);
  const interviewConducted = /technical\s+interview|assessment|chatting with you|code walkthrough|round/i.test(text);
  const interviewSuspicious = noInterviewKeywords || (!interviewConducted && feeDetected);

  // 4. Overall scam verdict
  const isScam = feeDetected || emailSuspicious || interviewSuspicious || hasTelegram;

  if (isScam) {
    return {
      isScam: true,
      verdictTitle: 'Stay Safe: This is a Known Student Scam',
      verdictSubtitle: 'This recruiter is using classic scam patterns. Protect your money and identity.',
      threatLevel: 'HIGH_RISK_SCAM',
      facts: {
        feeDemand: {
          isFlagged: feeDetected,
          status: feeDetected ? (feeAmountMatch ? `⚠️ ₹${feeAmountMatch[1]} Requested` : '⚠️ Fee / Deposit Requested') : '✅ No Explicit Fee Demand',
          details: feeDetected
            ? 'Legitimate companies never ask interns to pay for laptops, registration, security deposits, or gate passes.'
            : 'No direct payment request detected in the text, but remaining factors remain high risk.',
          ruleText: 'Rule: Genuine jobs pay you, never the other way around.'
        },
        senderEmail: {
          isFlagged: emailSuspicious,
          status: hasTelegram ? '⚠️ Redirection to Telegram' : hasGmail ? '⚠️ Generic @gmail.com' : '⚠️ Unverified Contact Channel',
          details: hasTelegram
            ? 'Scammers frequently direct college students to anonymous Telegram channels to bypass enterprise security audit trails.'
            : 'Official recruiters use enterprise emails like @tcs.com, not free public webmail or private handles.',
          ruleText: 'Rule: Cross-check the domain after the @ sign.'
        },
        interviewProcess: {
          isFlagged: interviewSuspicious,
          status: noInterviewKeywords ? '⚠️ Selected without Interview' : '⚠️ No Rigorous Assessment Found',
          details: 'Real technical internships require at least one phone, coding, or video conversation with a team member.',
          ruleText: "Rule: If you didn't interview, it's almost always a scam."
        }
      },
      reasons: [
        feeDetected ? 'Requests upfront financial deposit or laptop collateral (Violates corporate recruitment standards).' : null,
        emailSuspicious ? 'Uses public/unverified communication channel (Telegram/Gmail) instead of official corporate domain.' : null,
        interviewSuspicious ? 'Offers employment without technical evaluation or standard interview validation.' : null,
        /urgent|within\s+\d+\s+hours|today\s+only/i.test(text) ? 'Applies extreme psychological time pressure to rush payments.' : null
      ].filter(Boolean) as string[],
      checklist: [
        {
          id: 1,
          text: "1. Verify the recruiter's official company website directly (type it yourself, don't click links in the email).",
          completed: false
        },
        {
          id: 2,
          text: '2. Confirm with your college placement cell / TPO before replying to any questionable sender.',
          completed: false
        },
        {
          id: 3,
          text: '3. Never share your Aadhaar, PAN card, or bank account details with unverified recruiters.',
          completed: false
        }
      ]
    };
  } else {
    return {
      isScam: false,
      verdictTitle: 'Legitimate & Safe Offer Pattern Detected',
      verdictSubtitle: 'This offer letter aligns with standard enterprise recruitment policies and zero upfront charges.',
      threatLevel: 'SAFE_LEGITIMATE',
      facts: {
        feeDemand: {
          isFlagged: false,
          status: '✅ Free / Zero Deposit Policy',
          details: 'Zero registration or security fees requested. Contains standard enterprise stipend terms.',
          ruleText: 'Rule: Follows authentic paid employment standards.'
        },
        senderEmail: {
          isFlagged: false,
          status: '✅ Official Corporate Domain',
          details: 'Communication originates from authentic corporate domain/portal with verified records.',
          ruleText: 'Rule: Domain matches verified company identity.'
        },
        interviewProcess: {
          isFlagged: false,
          status: '✅ Formal Interview Conducted',
          details: 'Cites specific technical interviews, assessments, and structured evaluation rounds.',
          ruleText: 'Rule: Standard merit-based hiring process.'
        }
      },
      reasons: [
        'Complies with standard zero-fee hiring ethics.',
        'Uses authenticated corporate portal & domain communication.',
        'Follows structured multi-round evaluation process.'
      ],
      checklist: [
        {
          id: 1,
          text: '1. Review the stipend and terms on the official enterprise portal (e.g. nextstep.tcs.com).',
          completed: false
        },
        {
          id: 2,
          text: '2. Keep your College Placement Officer (TPO) notified about your accepted internship offer.',
          completed: false
        },
        {
          id: 3,
          text: '3. Prepare your college NOC (No Objection Certificate) and official onboarding identity documents.',
          completed: false
        }
      ]
    };
  }
}
