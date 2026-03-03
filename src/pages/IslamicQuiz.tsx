import { useState, useEffect } from "react";
import { AppBar } from "@/components/AppBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LayoutManager } from "@/components/LayoutManager";
import { Trophy, RotateCcw, CheckCircle, XCircle, Lightbulb, Award } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

const questions: Question[] = [
  {
    category: "Pillars of Islam",
    question: "What is the first pillar of Islam?",
    options: ["Salah (Prayer)", "Shahada (Declaration of Faith)", "Zakat (Charity)", "Sawm (Fasting)"],
    correctAnswer: 1,
    explanation: "The Shahada (Declaration of Faith) is the first pillar: 'There is no god but Allah, and Muhammad is His Messenger.'"
  },
  {
    category: "Quran",
    question: "How many surahs are in the Quran?",
    options: ["100", "114", "120", "99"],
    correctAnswer: 1,
    explanation: "The Quran contains 114 surahs (chapters)."
  },
  {
    category: "Prophets",
    question: "Who was the first prophet in Islam?",
    options: ["Prophet Musa (AS)", "Prophet Ibrahim (AS)", "Prophet Adam (AS)", "Prophet Nuh (AS)"],
    correctAnswer: 2,
    explanation: "Prophet Adam (AS) was the first prophet and the first human being created by Allah."
  },
  {
    category: "Prayer",
    question: "How many obligatory prayers are there in a day?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 2,
    explanation: "Muslims are required to pray 5 times daily: Fajr, Dhuhr, Asr, Maghrib, and Isha."
  },
  {
    category: "Ramadan",
    question: "In which month was the Quran revealed?",
    options: ["Shawwal", "Dhul Hijjah", "Ramadan", "Muharram"],
    correctAnswer: 2,
    explanation: "The Quran was revealed in the month of Ramadan, specifically on Laylat al-Qadr."
  },
  {
    category: "History",
    question: "What is the name of Prophet Muhammad's (PBUH) first wife?",
    options: ["Aisha (RA)", "Khadijah (RA)", "Fatimah (RA)", "Hafsa (RA)"],
    correctAnswer: 1,
    explanation: "Khadijah bint Khuwaylid (RA) was the first wife of Prophet Muhammad (PBUH)."
  },
  {
    category: "Quran",
    question: "What is the longest surah in the Quran?",
    options: ["Al-Fatiha", "Al-Baqarah", "Al-Imran", "An-Nisa"],
    correctAnswer: 1,
    explanation: "Surah Al-Baqarah is the longest surah with 286 verses."
  },
  {
    category: "Pillars of Islam",
    question: "What percentage of wealth is given as Zakat?",
    options: ["1%", "2.5%", "5%", "10%"],
    correctAnswer: 1,
    explanation: "Zakat is 2.5% of one's savings and assets above the nisab threshold."
  },
  {
    category: "History",
    question: "In which city was Prophet Muhammad (PBUH) born?",
    options: ["Madinah", "Makkah", "Jerusalem", "Taif"],
    correctAnswer: 1,
    explanation: "Prophet Muhammad (PBUH) was born in Makkah in 570 CE."
  },
  {
    category: "Prayer",
    question: "What direction do Muslims face during prayer?",
    options: ["East", "West", "Towards Makkah (Qibla)", "North"],
    correctAnswer: 2,
    explanation: "Muslims face the Kaaba in Makkah, known as the Qibla direction."
  },
  {
    category: "Angels",
    question: "Which angel is responsible for delivering revelations?",
    options: ["Mikail", "Israfil", "Jibril (Gabriel)", "Azrael"],
    correctAnswer: 2,
    explanation: "Angel Jibril (Gabriel) delivered Allah's revelations to the prophets."
  },
  {
    category: "Quran",
    question: "What is the shortest surah in the Quran?",
    options: ["Al-Fatiha", "Al-Ikhlas", "Al-Kawthar", "An-Nas"],
    correctAnswer: 2,
    explanation: "Surah Al-Kawthar is the shortest surah with only 3 verses."
  },
  {
    category: "History",
    question: "What year did the Hijra (migration to Madinah) occur?",
    options: ["610 CE", "622 CE", "630 CE", "632 CE"],
    correctAnswer: 1,
    explanation: "The Hijra occurred in 622 CE, marking the start of the Islamic calendar."
  },
  {
    category: "Pillars of Islam",
    question: "What is Hajj?",
    options: ["Daily prayer", "Fasting", "Pilgrimage to Makkah", "Charity"],
    correctAnswer: 2,
    explanation: "Hajj is the annual pilgrimage to Makkah, required once in a lifetime for able Muslims."
  },
  {
    category: "Prophets",
    question: "Which prophet built the Kaaba?",
    options: ["Prophet Muhammad (PBUH)", "Prophet Ibrahim (AS)", "Prophet Musa (AS)", "Prophet Isa (AS)"],
    correctAnswer: 1,
    explanation: "Prophet Ibrahim (AS) and his son Ismail (AS) built the Kaaba."
  },
  {
    category: "Quran",
    question: "How many juz (parts) is the Quran divided into?",
    options: ["20", "25", "30", "40"],
    correctAnswer: 2,
    explanation: "The Quran is divided into 30 juz to facilitate reading over a month."
  },
  {
    category: "Prayer",
    question: "What is the call to prayer called?",
    options: ["Salah", "Adhan", "Iqamah", "Dua"],
    correctAnswer: 1,
    explanation: "The Adhan is the Islamic call to prayer announced five times daily."
  },
  {
    category: "Ramadan",
    question: "What is the night of power called?",
    options: ["Laylat al-Qadr", "Laylat al-Bara'ah", "Laylat al-Miraj", "Laylat al-Isra"],
    correctAnswer: 0,
    explanation: "Laylat al-Qadr (Night of Power) is better than a thousand months."
  },
  {
    category: "History",
    question: "How many children did Prophet Muhammad (PBUH) have?",
    options: ["3", "5", "7", "9"],
    correctAnswer: 2,
    explanation: "Prophet Muhammad (PBUH) had 7 children: 3 sons and 4 daughters."
  },
  {
    category: "Angels",
    question: "Which angel will blow the trumpet on the Day of Judgment?",
    options: ["Jibril", "Mikail", "Israfil", "Azrael"],
    correctAnswer: 2,
    explanation: "Angel Israfil is tasked with blowing the trumpet (Sur) on the Day of Judgment."
  },
];

const QUIZ_STATS_KEY = 'islamic-quiz-stats';

interface QuizStats {
  totalPlayed: number;
  totalCorrect: number;
  highScore: number;
  lastPlayed: string;
}

export default function IslamicQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<QuizStats>({
    totalPlayed: 0,
    totalCorrect: 0,
    highScore: 0,
    lastPlayed: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem(QUIZ_STATS_KEY);
    if (saved) {
      setStats(JSON.parse(saved));
    }
    startNewQuiz();
  }, []);

  const startNewQuiz = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 10);
    setShuffledQuestions(shuffled);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setQuizComplete(false);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === shuffledQuestions[currentQuestion].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizComplete(true);
    const newStats: QuizStats = {
      totalPlayed: stats.totalPlayed + 1,
      totalCorrect: stats.totalCorrect + score,
      highScore: Math.max(stats.highScore, score),
      lastPlayed: new Date().toISOString(),
    };
    setStats(newStats);
    localStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(newStats));
  };

  if (shuffledQuestions.length === 0) {
    return (
      <LayoutManager>
        <div className="min-h-screen bg-background">
          <AppBar title="Islamic Quiz" showBack />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </LayoutManager>
    );
  }

  const question = shuffledQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;

  return (
    <LayoutManager>
      <div className="min-h-screen bg-background">
        <AppBar title="Islamic Quiz" showBack />
      
        <div className="max-w-lg mx-auto p-4 space-y-4">
        {!quizComplete ? (
          <>
            {/* Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestion + 1} of {shuffledQuestions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="font-bold">{score}</span>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            {/* Question */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Lightbulb className="w-3 h-3" />
                  {question.category}
                </div>
                <CardTitle className="text-lg">{question.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.options.map((option, index) => {
                  let buttonClass = "w-full justify-start text-left h-auto py-3 px-4";
                  
                  if (showResult) {
                    if (index === question.correctAnswer) {
                      buttonClass += " bg-primary/20 border-primary text-primary";
                    } else if (index === selectedAnswer && index !== question.correctAnswer) {
                      buttonClass += " bg-destructive/20 border-destructive text-destructive";
                    }
                  }
                  
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className={buttonClass}
                      onClick={() => handleAnswer(index)}
                      disabled={showResult}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{option}</span>
                        {showResult && index === question.correctAnswer && (
                          <CheckCircle className="w-4 h-4 ms-auto text-primary" />
                        )}
                        {showResult && index === selectedAnswer && index !== question.correctAnswer && (
                          <XCircle className="w-4 h-4 ms-auto text-destructive" />
                        )}
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Explanation */}
            {showResult && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">Explanation</p>
                      <p className="text-sm text-muted-foreground">{question.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Button */}
            {showResult && (
              <Button onClick={nextQuestion} className="w-full">
                {currentQuestion < shuffledQuestions.length - 1 ? 'Next Question' : 'See Results'}
              </Button>
            )}
          </>
        ) : (
          /* Results */
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 text-center">
              <Award className="w-16 h-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-4xl font-bold text-primary mb-2">
                {score} / {shuffledQuestions.length}
              </p>
              <p className="text-sm text-muted-foreground">
                {score >= 8 ? "Excellent! Ma sha Allah!" : 
                 score >= 6 ? "Good job! Keep learning!" : 
                 score >= 4 ? "Nice effort! Review and try again!" : 
                 "Keep studying! You'll improve!"}
              </p>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.totalPlayed}</p>
                  <p className="text-xs text-muted-foreground">Games Played</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.highScore}</p>
                  <p className="text-xs text-muted-foreground">High Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {stats.totalPlayed > 0 ? Math.round((stats.totalCorrect / (stats.totalPlayed * 10)) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
              <Button onClick={startNewQuiz} className="w-full gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </LayoutManager>
  );
}
