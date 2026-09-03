import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Copy, 
  Check, 
  RotateCcw, 
  Download, 
  Lock, 
  Sparkles, 
  AlertTriangle, 
  Mail, 
  DollarSign, 
  VideoOff, 
  PhoneCall,
  Upload
} from 'lucide-react';
import { analyzeOfferWithAI, AnalysisResult } from './analyzer';
import { extractTextFromPDF } from './pdfExtractor';
import { jsPDF } from 'jspdf';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync dark class on root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const query = typeof textToAnalyze === 'string' ? textToAnalyze : inputText;
    if (!query.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await analyzeOfferWithAI(query);
      setResult(res);
      setChecklistState({ 1: false, 2: false, 3: false });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setIsParsingPdf(true);
      try {
        const text = await extractTextFromPDF(file);
        setInputText(text);
        await handleAnalyze(text);
      } catch (err) {
        alert('Could not parse PDF text directly. Please paste the offer text into the box.');
      } finally {
        setIsParsingPdf(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (text) {
          setInputText(text);
          await handleAnalyze(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const toggleChecklist = (id: number) => {
    setChecklistState(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checklistState).filter(Boolean).length;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        setUploadedFileName(null);
      }
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    setInputText('');
    setUploadedFileName(null);
    setResult(null);
  };

  const handleExportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('SafeOffer AI - Internship & Job Offer Verification Audit', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text('------------------------------------------------------------', 14, 34);

    doc.setFontSize(14);
    doc.text(`Verdict: ${result.isScam ? 'HIGH RISK SCAM / FAKE OFFER' : 'SAFE / LEGITIMATE OFFER'}`, 14, 44);
    
    doc.setFontSize(11);
    doc.text(`Summary: ${result.verdictSubtitle}`, 14, 52);

    doc.text('Key Factor Breakdown:', 14, 64);
    doc.text(`- Fact 1 (Payment/Fee): ${result.facts.feeDemand.status}`, 18, 72);
    doc.text(`- Fact 2 (Recruiter Email): ${result.facts.senderEmail.status}`, 18, 80);
    doc.text(`- Fact 3 (Interview Process): ${result.facts.interviewProcess.status}`, 18, 88);

    doc.text('Recommendation Checklist:', 14, 102);
    result.checklist.forEach((item, idx) => {
      doc.text(`  [ ] ${item.text}`, 14, 110 + idx * 8);
    });

    doc.text('------------------------------------------------------------', 14, 140);
    doc.setFontSize(10);
    doc.text('TCS Tech Day 2026 Prototype | AI + Cyber Defense Track', 14, 148);
    doc.save('SafeOffer_Verification_Report.pdf');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-[#070B13] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'}`}>
      
      {/* Top Navbar */}
      <header className={`border-b ${isDark ? 'border-slate-800/80 bg-[#070B13]/90' : 'border-slate-200 bg-white/90'} sticky top-0 z-50 backdrop-blur-md`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight">SafeOffer</h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI Cyber Defense
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Student Internship & Job Offer Scam Detector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("College Placement Cell & TPO advisory: Always report suspicious recruiters claiming fees to tpo@college.edu or National Cyber Helpline 1930.")}
              className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                isDark 
                  ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300' 
                  : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              College Safety Shield
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                isDark 
                  ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300' 
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        
        {/* Hero Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant AI NLP Legitimacy Check</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Is your internship or job offer real or a scam?
          </h2>
          <p className={`text-sm sm:text-base max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Upload your offer letter PDF or paste recruiter communication to verify upfront fees, recruiter legitimacy, and interview standards in seconds.
          </p>
        </div>

        {/* Upload Box */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.txt,.doc,.docx"
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer text-center transition group ${
            isDark 
              ? 'border-indigo-500/30 bg-indigo-950/10 hover:bg-indigo-950/30 hover:border-indigo-500/60' 
              : 'border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/80 hover:border-indigo-300'
          }`}
        >
          <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
            {isParsingPdf ? 'Extracting text from PDF...' : 'Click to Upload Offer Letter (PDF / DOC / TXT)'}
          </div>
          <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {uploadedFileName ? `Selected: ${uploadedFileName}` : 'or paste the offer communication directly below'}
          </div>
        </div>

        {/* Input Text Area Box */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0B111E] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <label className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {uploadedFileName ? `Document Content: ${uploadedFileName}` : 'Paste Internship / Job Offer Text'}
              </label>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {inputText.length} characters
              </span>
              <button
                onClick={handlePaste}
                className={`text-xs font-medium px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                Paste Clipboard
              </button>
              {inputText && (
                <button
                  onClick={handleClear}
                  className={`text-xs font-medium px-2 py-1 rounded-md transition ${
                    isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setUploadedFileName(null);
            }}
            rows={7}
            placeholder="Paste any offer email, job letter body, WhatsApp message, Telegram text, or stipend terms here..."
            className={`w-full p-4 rounded-xl text-xs sm:text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-y ${
              isDark 
                ? 'bg-[#060911] border-slate-800 text-slate-200 placeholder-slate-600' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Privacy assured: Analyzed securely in your browser.</span>
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !inputText.trim()}
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>{isAnalyzing ? 'AI Evaluating Offer...' : 'Check Offer Safety'}</span>
            </button>
          </div>
        </div>

        {/* DECISION -> REASON -> NEXT ACTION RESULTS SECTION */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* 1. DECISION: Big Verdict Banner */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                result.isScam
                  ? isDark
                    ? 'bg-gradient-to-r from-rose-950/50 via-[#160B12] to-slate-900 border-rose-800/60 shadow-lg shadow-rose-950/30'
                    : 'bg-rose-50/90 border-rose-200 text-rose-950 shadow-sm'
                  : isDark
                    ? 'bg-gradient-to-r from-emerald-950/50 via-[#0B1713] to-slate-900 border-emerald-800/60 shadow-lg shadow-emerald-950/30'
                    : 'bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      result.isScam 
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400' 
                        : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    }`}
                  >
                    {result.isScam ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-1.5 bg-black/20 border border-current">
                      <span className={`w-2 h-2 rounded-full ${result.isScam ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                      {result.isScam ? 'FAKE OFFER DETECTED — DO NOT PAY' : 'SAFE / VERIFIED OFFER PATTERN'}
                    </div>

                    <h3 className={`text-xl sm:text-2xl font-extrabold ${
                      result.isScam 
                        ? isDark ? 'text-white' : 'text-rose-900' 
                        : isDark ? 'text-white' : 'text-emerald-900'
                    }`}>
                      {result.verdictTitle}
                    </h3>
                    <p className={`text-xs sm:text-sm mt-1 ${
                      result.isScam 
                        ? isDark ? 'text-rose-300/80' : 'text-rose-700' 
                        : isDark ? 'text-emerald-300/80' : 'text-emerald-700'
                    }`}>
                      {result.verdictSubtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. REASON: 3 Key Forensic Fact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Fact 1: Fee Demand */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0B111E] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      FACT 1: FEE DEMAND
                    </span>
                    <DollarSign className={`w-4 h-4 ${result.facts.feeDemand.isFlagged ? 'text-rose-400' : 'text-emerald-400'}`} />
                  </div>

                  <div className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block mb-2.5 ${
                    result.facts.feeDemand.isFlagged 
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {result.facts.feeDemand.status}
                  </div>

                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {result.facts.feeDemand.details}
                  </p>
                </div>

                <div className={`mt-3 pt-3 border-t text-[11px] font-medium ${
                  result.facts.feeDemand.isFlagged ? 'text-amber-400/90' : 'text-emerald-400/90'
                } ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                  • {result.facts.feeDemand.ruleText}
                </div>
              </div>

              {/* Fact 2: Sender Email */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0B111E] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      FACT 2: SENDER EMAIL
                    </span>
                    <Mail className={`w-4 h-4 ${result.facts.senderEmail.isFlagged ? 'text-rose-400' : 'text-emerald-400'}`} />
                  </div>

                  <div className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block mb-2.5 ${
                    result.facts.senderEmail.isFlagged 
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {result.facts.senderEmail.status}
                  </div>

                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {result.facts.senderEmail.details}
                  </p>
                </div>

                <div className={`mt-3 pt-3 border-t text-[11px] font-medium ${
                  result.facts.senderEmail.isFlagged ? 'text-amber-400/90' : 'text-emerald-400/90'
                } ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                  • {result.facts.senderEmail.ruleText}
                </div>
              </div>

              {/* Fact 3: Interview Process */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0B111E] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      FACT 3: INTERVIEW PROCESS
                    </span>
                    <VideoOff className={`w-4 h-4 ${result.facts.interviewProcess.isFlagged ? 'text-rose-400' : 'text-emerald-400'}`} />
                  </div>

                  <div className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block mb-2.5 ${
                    result.facts.interviewProcess.isFlagged 
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {result.facts.interviewProcess.status}
                  </div>

                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {result.facts.interviewProcess.details}
                  </p>
                </div>

                <div className={`mt-3 pt-3 border-t text-[11px] font-medium ${
                  result.facts.interviewProcess.isFlagged ? 'text-amber-400/90' : 'text-emerald-400/90'
                } ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                  • {result.facts.interviewProcess.ruleText}
                </div>
              </div>

            </div>

            {/* 3. NEXT ACTION: Student Action Checklist */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0B111E] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    What should you do right now?
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Protect yourself with these 3 quick precautions:
                  </p>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {completedCount} of 3 Completed
                </span>
              </div>

              <div className="space-y-3">
                {result.checklist.map((item) => {
                  const isChecked = checklistState[item.id] || false;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 text-xs sm:text-sm ${
                        isChecked
                          ? isDark 
                            ? 'bg-indigo-950/30 border-indigo-500/60 text-indigo-200' 
                            : 'bg-indigo-50 border-indigo-300 text-indigo-900'
                          : isDark
                            ? 'bg-[#060911] border-slate-800/90 text-slate-300 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition ${
                        isChecked 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={isChecked ? 'line-through opacity-80' : ''}>
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleExportPDF}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition ${
                      isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Report
                  </button>

                  <button
                    onClick={handleClear}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition ${
                      isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset & Scan Another
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Need help? National Cyber Fraud Helpline: <strong className="text-slate-200 font-mono">1930</strong> (Toll-Free)</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className={`border-t py-6 mt-12 text-xs ${
        isDark ? 'border-slate-800/80 text-slate-500 bg-[#070B13]' : 'border-slate-200 text-slate-500 bg-white'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 SafeOffer AI • Simple Internship & Job Protection for Students
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Zero cybersecurity jargon</span>
            <span>•</span>
            <span className="text-emerald-500 font-semibold">100% Free & Private</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
