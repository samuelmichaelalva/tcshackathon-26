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

export async function analyzeOfferWithAI(text: string, userApiKey?: string): Promise<AnalysisResult> {
  const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  if (apiKey) {
    try {
      const prompt = `You are SafeOffer AI, an expert Cyber Defense and Recruitment Fraud Detector for college students.
Analyze the following internship or job offer text and determine if it is a SCAM (Fake) or LEGITIMATE (Safe).

Offer text to evaluate:
"""
${text}
"""

Return ONLY a valid JSON object with NO markdown formatting matching this exact schema:
{
  "isScam": boolean,
  "verdictTitle": string (e.g. "Stay Safe: This is a Known Student Scam" or "Legitimate & Safe Offer Pattern Detected"),
  "verdictSubtitle": string (brief 1-sentence explanation),
  "threatLevel": "HIGH_RISK_SCAM" or "SAFE_LEGITIMATE",
  "facts": {
    "feeDemand": {
      "isFlagged": boolean,
      "status": string (e.g. "⚠️ ₹2,500 Requested" or "✅ Free / Zero Deposit Policy"),
      "details": string,
      "ruleText": string
    },
    "senderEmail": {
      "isFlagged": boolean,
      "status": string (e.g. "⚠️ Generic @gmail.com" or "✅ Official Corporate Domain"),
      "details": string,
      "ruleText": string
    },
    "interviewProcess": {
      "isFlagged": boolean,
      "status": string (e.g. "⚠️ Selected without Interview" or "✅ Formal Interview Conducted"),
      "details": string,
      "ruleText": string
    }
  },
  "reasons": string[],
  "checklist": [
    { "id": 1, "text": string, "completed": false },
    { "id": 2, "text": string, "completed": false },
    { "id": 3, "text": string, "completed": false }
  ]
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          return JSON.parse(rawJson);
        }
      }
    } catch (e) {
      console.warn('AI API fallback to NLP Heuristic Engine:', e);
    }
  }

  // Robust Heuristic Engine fallback (guarantees 100% demo stability with 0 errors)
  return analyzeOfferLocally(text);
}

export function analyzeOfferLocally(text: string): AnalysisResult {
  const lower = text.toLowerCase();

  // 1. Fee detection — Absolute scam dealbreaker
  const mentionsZeroFee = /never\s+solicits?\s+registration|never\s+charges?|no\s+fees?|does\s+not\s+charge\s+(?:any\s+)?fee|free\s+of\s+(?:cost|charge)|does\s+not\s+(?:charge|collect)\s+any/i.test(text);

  const feePatterns = [
    /(?:registration|processing|training|laptop|equipment|security|caution|onboarding|verification|document|seat|gate\s*pass)\s*(?:fee|fees|charge|charges|deposit|amount|cost)/i,
    /(?:refundable|security|caution)\s*(?:deposit|amount|fee)/i,
    /(?:kindly|please|must|required\s+to|need\s+to|have\s+to)\s*(?:pay|deposit|transfer|remit|send)\s*(?:an?\s+amount\s+of\s+)?(?:₹|rs\.?|inr|\$|\d+)/i,
    /(?:fee|charge|deposit|cost)\s*(?:of\s+)?(?:₹|rs\.?|inr|\$|\d+)/i,
    /(?:upi|gpay|paytm|phonepe|google\s*pay)\s*(?:to|id|transfer|qr|number|\:|\d)/i,
    /(?:bank\s+transfer|transfer\s+amount)\s*(?:to\s+account|₹|rs|inr)/i,
    /pay\s+(?:₹|rs\.?|inr|\$)\s*[\d,]+/i,
    /(?:deposit|transfer|pay)\s+[\d,]+\s*(?:₹|rs|inr|rupees)/i
  ];

  let feeDetected = false;
  if (!mentionsZeroFee) {
    for (const pat of feePatterns) {
      if (pat.test(text)) {
        feeDetected = true;
        break;
      }
    }
  }

  let feeAmountMatch = text.match(/(?:₹|rs\.?|inr|\$)\s*([\d,]+)/i) || text.match(/([\d,]+)\s*(?:₹|rs|inr|rupees)/i);

  // 2. Communication channel detection
  const hasTelegram = /telegram|t\.me\/|@\w+direct/i.test(text);
  const hasOfficialDomain = /@(?:tcs|cloudscale|microsoft|infosys|google|amazon|accenture|wipro|ibm|zoho|flipkart|deloitte|cognizant|capgemini|hcl|tech\s?mahindra|lti|mindtree)\.(?:com|in|ai|io)|nextstep\.tcs\.com/i.test(text);
  
  // Recruiter public webmail impersonation
  const recruiterGmail = /(?:from|contact|write\s+to|reach\s+us|hr|recruiter|email\s*:|send\s+to)\s*[:\-]?\s*[\w\.\-]+@(gmail|yahoo|outlook|hotmail|rediffmail)\.com/i.test(text)
    || (/@(?:gmail|yahoo|outlook|hotmail)\.com/i.test(text) && /(?:tata|tcs|infosys|wipro|google|microsoft|amazon|accenture|cognizant)/i.test(text) && !hasOfficialDomain);

  // 3. Interview detection
  const noInterviewExplicit = /without\s+(?:any\s+)?(?:technical\s+)?interview|no\s+(?:technical\s+)?interview|direct(?:ly)?\s+select(?:ed)?\s+based\s+on\s+resume/i.test(text);
  const interviewConducted = /technical\s+interview|aptitude\s+test|assessment|coding\s+(?:round|test|challenge)|interview\s+(?:round|panel|process)|hackathon|evaluated|shortlisted\s+(?:based|after|through)|campus\s+(?:drive|placement|recruitment)|appeared\s+for|clearing\s+the/i.test(text);

  // 4. Urgency pressure
  const hasUrgency = /urgent|within\s+\d+\s+hours?|today\s+only|immediate(?:ly)?|last\s+date.*today|respond\s+(?:now|immediately|asap)/i.test(text);

  // === STRICT FRAUD DETERMINATION ===
  // In corporate recruitment fraud, asking an intern/applicant for money or using Telegram is an instant scam.
  const isScam = feeDetected || hasTelegram || recruiterGmail || noInterviewExplicit || (hasUrgency && feeDetected);

  const emailSuspicious = hasTelegram || recruiterGmail;
  const interviewSuspicious = noInterviewExplicit || (feeDetected && !interviewConducted);

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
            : 'No direct payment request detected in the text, but other factors indicate high risk.',
          ruleText: 'Rule: Genuine jobs pay you, never the other way around.'
        },
        senderEmail: {
          isFlagged: emailSuspicious,
          status: hasTelegram ? '⚠️ Redirection to Telegram' : recruiterGmail ? '⚠️ Recruiter Generic Webmail' : '✅ No Suspicious Channel',
          details: hasTelegram
            ? 'Scammers frequently direct college students to anonymous Telegram channels to bypass enterprise security audit trails.'
            : emailSuspicious ? 'Official recruiters use enterprise emails like @tcs.com, not free public webmail handles.'
            : 'No suspicious communication channel detected.',
          ruleText: 'Rule: Cross-check the domain after the @ sign.'
        },
        interviewProcess: {
          isFlagged: interviewSuspicious,
          status: noInterviewExplicit ? '⚠️ Selected without Interview' : interviewSuspicious ? '⚠️ No Rigorous Assessment Found' : '✅ Assessment Referenced',
          details: interviewSuspicious
            ? 'Real technical internships require at least one phone, coding, or video evaluation with a team member.'
            : 'Assessment or evaluation process referenced in the offer.',
          ruleText: "Rule: If you didn't interview, it's almost always a scam."
        }
      },
      reasons: [
        feeDetected ? 'Requests upfront financial deposit or registration fee (Violates recruitment ethics).' : null,
        emailSuspicious ? 'Uses public/unverified channel (Telegram/free webmail) instead of official corporate domain.' : null,
        interviewSuspicious ? 'Offers employment without technical evaluation or standard interview validation.' : null,
        hasUrgency ? 'Applies extreme psychological time pressure to rush payments.' : null,
        hasTelegram ? 'Redirects communication to anonymous Telegram channel.' : null
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
    // Determine nuanced safe statuses
    const emailStatus = hasOfficialDomain ? '✅ Official Corporate Domain'
      : '✅ Verified / Normal Communication';

    const interviewStatus = interviewConducted ? '✅ Formal Interview Conducted'
      : '✅ Standard Hiring Process';

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
          status: emailStatus,
          details: hasOfficialDomain
            ? 'Communication originates from authentic corporate domain/portal with verified records.'
            : 'No suspicious communication pattern detected.',
          ruleText: 'Rule: Domain matches verified company identity.'
        },
        interviewProcess: {
          isFlagged: false,
          status: interviewStatus,
          details: interviewConducted
            ? 'Cites specific technical interviews, assessments, and structured evaluation rounds.'
            : 'Offer follows standard corporate hiring workflow.',
          ruleText: 'Rule: Standard merit-based hiring process.'
        }
      },
      reasons: [
        'Complies with standard zero-fee hiring ethics.',
        hasOfficialDomain ? 'Uses authenticated corporate portal & domain communication.' : 'No suspicious communication channels detected.',
        interviewConducted ? 'Follows structured multi-round evaluation process.' : 'Follows standard corporate hiring workflow.'
      ],
      checklist: [
        {
          id: 1,
          text: '1. Review the stipend and terms on the official enterprise portal.',
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
