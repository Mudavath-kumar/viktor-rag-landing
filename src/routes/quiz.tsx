import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell, SectionEyebrow, PrimaryBtn, SecondaryBtn } from "@/components/site-chrome";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "AI Quiz — Viktor RAG" },
      { name: "description", content: "Test your knowledge with AI-generated quizzes." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    docId: (search.docId as string) || "",
    docName: (search.docName as string) || "Document",
  }),
  component: QuizPage,
});

type Question = {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

function QuizPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { docId, docName } = Route.useSearch();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  useEffect(() => {
    if (user && docId) {
      loadQuiz();
    }
  }, [user, docId]);

  const loadQuiz = async () => {
    if (!user || !docId) return;
    setLoading(true);
    try {
      // Try cached first
      const cached = await api.getQuiz(docId);
      if (cached.questions && cached.questions.length > 0) {
        setQuestions(cached.questions);
        setAnswers(new Array(cached.questions.length).fill(null));
      } else {
        // Generate fresh
        const result = await api.generateQuiz(user.id, docId);
        setQuestions(result.questions || []);
        setAnswers(new Array((result.questions || []).length).fill(null));
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load quiz");
    }
    setLoading(false);
  };

  const regenerateQuiz = async () => {
    if (!user || !docId) return;
    setLoading(true);
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setCompleted(false);
    try {
      const result = await api.generateQuiz(user.id, docId);
      setQuestions(result.questions || []);
      setAnswers(new Array((result.questions || []).length).fill(null));
      toast.success("New quiz generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to regenerate quiz");
    }
    setLoading(false);
  };

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
    if (idx === questions[currentQ].correct) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setCompleted(true);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <PageShell>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f5d4f]"></div>
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return null;
  }

  if (!docId) {
    return (
      <PageShell>
        <section className="px-6 max-w-[800px] mx-auto pb-24 text-center pt-20">
          <Brain className="w-16 h-16 text-[#1f5d4f] mx-auto mb-6" />
          <h1 className="text-3xl font-medium">No document selected</h1>
          <p className="text-[#273C46] mt-3">
            Go to Upload page and click the quiz button on a document.
          </p>
          <div className="mt-8">
            <button onClick={() => navigate({ to: "/upload" })}>
              <PrimaryBtn>Go to Upload</PrimaryBtn>
            </button>
          </div>
        </section>
      </PageShell>
    );
  }

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  return (
    <PageShell>
      <section className="px-6 max-w-[800px] mx-auto pb-24">
        <SectionEyebrow>AI Quiz</SectionEyebrow>
        <h1 className="mt-3 text-[36px] md:text-[48px] leading-[1] tracking-tight">
          Test your <span className="font-mondwest text-[#1f5d4f]">knowledge</span>
        </h1>
        <p className="mt-4 text-[#273C46]">
          AI-generated quiz from <span className="font-medium text-[#051A24]">{docName}</span>
        </p>

        {loading && (
          <div className="mt-16 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-[#1f5d4f]/20 border-t-[#1f5d4f] animate-spin" />
              <Brain className="w-8 h-8 text-[#1f5d4f] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[#273C46] animate-pulse">Generating quiz questions...</p>
          </div>
        )}

        {!loading && questions.length === 0 && (
          <div className="mt-16 text-center">
            <Brain className="w-16 h-16 text-[#273C46]/30 mx-auto mb-4" />
            <p className="text-[#273C46]">
              No quiz questions could be generated for this document.
            </p>
            <button onClick={regenerateQuiz} className="mt-4">
              <PrimaryBtn>Try Again</PrimaryBtn>
            </button>
          </div>
        )}

        {!loading && !completed && questions.length > 0 && (
          <div className="mt-10">
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-2 bg-[#051A24]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1f5d4f] to-[#5cc9b1] rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentQ + (answered ? 1 : 0)) / questions.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-[#273C46] shrink-0">
                {currentQ + 1}/{questions.length}
              </span>
            </div>

            {/* Question card */}
            <div className="bg-white rounded-[28px] border border-[#051A24]/5 shadow-[0_20px_40px_-20px_rgba(5,26,36,0.12)] overflow-hidden">
              <div className="p-8 md:p-10">
                <div className="flex items-start gap-3 mb-6">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[#1f5d4f] text-white flex items-center justify-center text-sm font-medium">
                    {currentQ + 1}
                  </span>
                  <h2 className="text-lg md:text-xl font-medium text-[#051A24] leading-snug">
                    {questions[currentQ].question}
                  </h2>
                </div>

                <div className="space-y-3">
                  {questions[currentQ].options.map((opt, idx) => {
                    let borderColor = "border-[#051A24]/10";
                    let bgColor = "bg-white hover:bg-[#f0f0ee]";
                    let textColor = "text-[#051A24]";
                    let ringStyle = "";

                    if (answered) {
                      if (idx === questions[currentQ].correct) {
                        borderColor = "border-emerald-400";
                        bgColor = "bg-emerald-50";
                        textColor = "text-emerald-800";
                        ringStyle = "ring-2 ring-emerald-400/30";
                      } else if (idx === selected && idx !== questions[currentQ].correct) {
                        borderColor = "border-red-400";
                        bgColor = "bg-red-50";
                        textColor = "text-red-800";
                        ringStyle = "ring-2 ring-red-400/30";
                      } else {
                        bgColor = "bg-[#f0f0ee]/50";
                        textColor = "text-[#273C46]/60";
                      }
                    } else if (selected === idx) {
                      borderColor = "border-[#1f5d4f]";
                      bgColor = "bg-[#1f5d4f]/5";
                      ringStyle = "ring-2 ring-[#1f5d4f]/20";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={answered}
                        className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border ${borderColor} ${bgColor} ${textColor} ${ringStyle} transition-all duration-200 disabled:cursor-default`}
                      >
                        <span
                          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border ${
                            answered && idx === questions[currentQ].correct
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : answered && idx === selected
                                ? "bg-red-500 text-white border-red-500"
                                : "border-[#051A24]/20 text-[#273C46]"
                          }`}
                        >
                          {answered && idx === questions[currentQ].correct ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : answered && idx === selected ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
                        </span>
                        <span className="text-[15px]">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {answered && questions[currentQ].explanation && (
                  <div className="mt-6 bg-[#1f5d4f]/8 rounded-2xl p-5 animate-in slide-in-from-bottom-2">
                    <p className="text-[10px] uppercase tracking-wide text-[#1f5d4f] font-semibold mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Explanation
                    </p>
                    <p className="text-sm text-[#051A24] leading-relaxed">
                      {questions[currentQ].explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {answered && (
                <div className="border-t border-[#051A24]/5 px-8 py-4 flex items-center justify-between bg-[#f0f0ee]/30">
                  <p className="text-sm text-[#273C46]">
                    Score:{" "}
                    <span className="font-medium text-[#1f5d4f]">
                      {score}/{currentQ + 1}
                    </span>
                  </p>
                  <button
                    onClick={nextQuestion}
                    className="flex items-center gap-2 bg-[#051A24] text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-[#0D212C] transition"
                  >
                    {currentQ < questions.length - 1 ? (
                      <>
                        Next <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        See Results <Trophy className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completion Screen */}
        {completed && (
          <div className="mt-10">
            <div className="bg-white rounded-[28px] border border-[#051A24]/5 shadow-[0_20px_40px_-20px_rgba(5,26,36,0.12)] p-10 md:p-14 text-center">
              {/* Celebration */}
              <div className="relative inline-block mb-6">
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center ${pct >= 80 ? "bg-emerald-100" : pct >= 50 ? "bg-amber-100" : "bg-red-100"}`}
                >
                  <Trophy
                    className={`w-12 h-12 ${pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}
                  />
                </div>
                {pct >= 80 && (
                  <>
                    <span
                      className="absolute -top-2 -left-2 text-2xl animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    >
                      🎉
                    </span>
                    <span
                      className="absolute -top-2 -right-2 text-2xl animate-bounce"
                      style={{ animationDelay: "200ms" }}
                    >
                      ⭐
                    </span>
                    <span
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl animate-bounce"
                      style={{ animationDelay: "400ms" }}
                    >
                      🏆
                    </span>
                  </>
                )}
              </div>

              <h2 className="text-3xl font-mondwest text-[#051A24]">
                {pct >= 80 ? "Excellent!" : pct >= 50 ? "Good effort!" : "Keep learning!"}
              </h2>
              <p className="mt-3 text-[#273C46]">
                You scored <span className="font-medium text-[#051A24]">{score}</span> out of{" "}
                <span className="font-medium text-[#051A24]">{questions.length}</span> questions
              </p>

              {/* Score ring */}
              <div className="mt-8 mb-8">
                <div className="relative w-36 h-36 mx-auto">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#051A24"
                      strokeOpacity="0.08"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * 314} 314`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mondwest text-4xl text-[#051A24]">{pct}%</span>
                  </div>
                </div>
              </div>

              {/* Answer breakdown */}
              <div className="flex justify-center gap-2 mb-8">
                {answers.map((a, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                      a === questions[i]?.correct
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button onClick={regenerateQuiz}>
                  <SecondaryBtn>
                    <RotateCcw className="w-4 h-4 mr-2" /> New Quiz
                  </SecondaryBtn>
                </button>
                <button onClick={() => navigate({ to: "/upload" })}>
                  <PrimaryBtn>Back to Documents</PrimaryBtn>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
