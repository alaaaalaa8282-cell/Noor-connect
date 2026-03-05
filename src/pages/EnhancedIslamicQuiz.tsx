import { useState, useEffect, useCallback } from 'react';
import { AppBar } from '@/components/AppBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LayoutManager } from '@/components/LayoutManager';
import { 
  Trophy, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  Award,
  Star,
  Zap,
  Clock,
  Target,
  Flame,
  Gift,
  Shield,
  Crown,
  TrendingUp,
  Timer,
  HelpCircle
} from 'lucide-react';
import { quizManager } from '@/lib/quiz-manager';
import { AchievementDisplay } from '@/components/AchievementDisplay';
import { 
  QUIZ_CATEGORIES, 
  ACHIEVEMENTS, 
  POWER_UPS,
  type QuizQuestion,
  type QuizStats,
  type Achievement,
  type PowerUp 
} from '@/data/enhanced-quiz-data';

interface GameState {
  questions: QuizQuestion[];
  currentQuestion: number;
  selectedAnswer: number | null;
  showResult: boolean;
  score: number;
  streak: number;
  timeLeft: number;
  isTimerActive: boolean;
  usedPowerUps: string[];
  categoryAnswers: Record<string, { correct: number; total: number }>;
  quizMode: 'endless' | 'fixed'; // Add quiz mode
}

export default function EnhancedIslamicQuiz() {
  const [gameState, setGameState] = useState<GameState>({
    questions: [],
    currentQuestion: 0,
    selectedAnswer: null,
    showResult: false,
    score: 0,
    streak: 0,
    timeLeft: 30,
    isTimerActive: false,
    usedPowerUps: [],
    categoryAnswers: {},
    quizMode: 'endless' // Default to endless mode
  });
  
  const [quizComplete, setQuizComplete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [gameMode, setGameMode] = useState<'menu' | 'playing' | 'results' | 'achievements'>('menu');

  useEffect(() => {
    setStats(quizManager.getStats());
    setPowerUps(quizManager.getPowerUps());
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState.isTimerActive && gameState.timeLeft > 0) {
      timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (gameState.timeLeft === 0 && gameState.isTimerActive) {
      handleTimeUp();
    }
    return () => clearTimeout(timer);
  }, [gameState.timeLeft, gameState.isTimerActive]);

  const startNewQuiz = useCallback(() => {
    // Get more questions for endless mode
    const questions = quizManager.getQuestions(selectedCategory || undefined, 
                                           selectedDifficulty !== 'all' ? selectedDifficulty : undefined, 
                                           50); // Get 50 questions for endless mode
    
    setGameState({
      questions,
      currentQuestion: 0,
      selectedAnswer: null,
      showResult: false,
      score: 0,
      streak: 0,
      timeLeft: questions[0]?.timeLimit || 30,
      isTimerActive: true,
      usedPowerUps: [],
      categoryAnswers: {},
      quizMode: 'endless'
    });
    setQuizComplete(false);
    setNewAchievements([]);
    setGameMode('playing');
  }, [selectedCategory, selectedDifficulty]);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (gameState.showResult) return;
    
    const question = gameState.questions[gameState.currentQuestion];
    const isCorrect = answerIndex === question.correctAnswer;
    
    // Update category answers
    const categoryAnswers = { ...gameState.categoryAnswers };
    if (!categoryAnswers[question.category]) {
      categoryAnswers[question.category] = { correct: 0, total: 0 };
    }
    categoryAnswers[question.category].total += 1;
    if (isCorrect) {
      categoryAnswers[question.category].correct += 1;
    }
    
    setGameState(prev => ({
      ...prev,
      selectedAnswer: answerIndex,
      showResult: true,
      isTimerActive: false,
      score: isCorrect ? prev.score + question.points : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
      categoryAnswers
    }));
    
    // In endless mode, end quiz if answer is wrong
    if (!isCorrect && gameState.quizMode === 'endless') {
      setTimeout(() => {
        finishQuiz();
      }, 2000); // Show result for 2 seconds then end
    }
  }, [gameState.showResult, gameState.questions, gameState.currentQuestion, gameState.quizMode]);

  const handleTimeUp = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showResult: true,
      isTimerActive: false,
      streak: 0
    }));
    
    // In endless mode, time up also ends the quiz
    if (gameState.quizMode === 'endless') {
      setTimeout(() => {
        finishQuiz();
      }, 2000);
    }
  }, [gameState.quizMode]);

  const nextQuestion = useCallback(() => {
    // In endless mode, only continue if answer was correct
    if (gameState.quizMode === 'endless') {
      const lastAnswer = gameState.selectedAnswer;
      const lastQuestion = gameState.questions[gameState.currentQuestion];
      const wasCorrect = lastAnswer === lastQuestion.correctAnswer;
      
      if (!wasCorrect) {
        return; // Don't continue if wrong answer in endless mode
      }
    }
    
    if (gameState.currentQuestion < gameState.questions.length - 1) {
      const nextQuestionIndex = gameState.currentQuestion + 1;
      const nextQ = gameState.questions[nextQuestionIndex];
      
      setGameState(prev => ({
        ...prev,
        currentQuestion: nextQuestionIndex,
        selectedAnswer: null,
        showResult: false,
        timeLeft: nextQ?.timeLimit || 30,
        isTimerActive: true
      }));
    } else {
      finishQuiz();
    }
  }, [gameState]);

  const finishQuiz = useCallback(() => {
    setQuizComplete(true);
    setGameMode('results');
    
    const updatedStats = quizManager.updateStats(
      gameState.score,
      gameState.questions.length,
      gameState.categoryAnswers,
      gameState.streak
    );
    
    setStats(updatedStats);
    
    // Check for new achievements
    const achievements = quizManager.getAchievements();
    const newOnes = achievements.filter(a => a.unlocked && !stats?.achievements.includes(a.id));
    setNewAchievements(newOnes);
    
    if (newOnes.length > 0) {
      setShowAchievements(true);
    }
  }, [gameState, stats]);

  const handleUsePowerUp = useCallback((powerUpId: string) => {
    if (gameState.usedPowerUps.includes(powerUpId)) return;
    
    const success = quizManager.usePowerUp(powerUpId);
    if (success) {
      setPowerUps(quizManager.getPowerUps());
      
      switch (powerUpId) {
        case 'fifty_fifty':
          // Implementation would remove two incorrect answers
          break;
        case 'extra_time':
          setGameState(prev => ({
            ...prev,
            timeLeft: prev.timeLeft + 30,
            usedPowerUps: [...prev.usedPowerUps, powerUpId]
          }));
          break;
        case 'skip':
          nextQuestion();
          break;
      }
    }
  }, [gameState.usedPowerUps, nextQuestion]);

  if (gameMode === 'menu') {
    return <QuizMenu 
      onStartQuiz={startNewQuiz}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      selectedDifficulty={selectedDifficulty}
      setSelectedDifficulty={setSelectedDifficulty}
      stats={stats}
      powerUps={powerUps}
      onShowAchievements={() => setGameMode('achievements')}
    />;
  }

  if (gameMode === 'achievements') {
    return (
      <LayoutManager>
        <div className="min-h-screen bg-background">
          <AppBar title="Achievements" showBack />
          <div className="max-w-lg mx-auto p-4">
            <AchievementDisplay />
          </div>
        </div>
      </LayoutManager>
    );
  }

  if (gameMode === 'playing' && gameState.questions.length === 0) {
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

  const question = gameState.questions[gameState.currentQuestion];
  const progress = gameState.quizMode === 'endless' 
    ? 0 // No progress in endless mode
    : ((gameState.currentQuestion + 1) / gameState.questions.length) * 100;
  
  // Timer progress
  const timerProgress = question?.timeLimit ? ((question.timeLimit - gameState.timeLeft) / question.timeLimit) * 100 : 0;

  return (
    <LayoutManager>
      <div className="min-h-screen bg-background">
        <AppBar title="Islamic Quiz" showBack />
      
        <div className="max-w-lg mx-auto p-4 space-y-4">
          {!quizComplete ? (
            <>
              {/* Header with Stats */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="font-bold">{gameState.score}</span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-bold">{gameState.streak}</span>
                      <span className="text-sm text-muted-foreground">streak</span>
                    </div>
                  </div>
                  
                  {/* Timer Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Time Remaining</span>
                      <span className={`text-xs font-bold ${gameState.timeLeft <= 10 ? 'text-red-500' : 'text-primary'}`}>
                        {gameState.timeLeft}s
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          gameState.timeLeft <= 10 ? 'bg-red-500' : 'bg-primary'
                        }`}
                        style={{ width: `${100 - timerProgress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Progress Bar (only for fixed mode) */}
                  {gameState.quizMode !== 'endless' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          Question {gameState.currentQuestion + 1} of {gameState.questions.length}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Power-ups */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Power-ups</span>
                  </div>
                  <div className="flex gap-2">
                    {powerUps.filter(p => p.uses > 0 && !gameState.usedPowerUps.includes(p.id)).map(powerUp => (
                      <Button
                        key={powerUp.id}
                        size="sm"
                        variant="outline"
                        onClick={() => handleUsePowerUp(powerUp.id)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <span>{powerUp.icon}</span>
                        <span>{powerUp.name} ({powerUp.uses})</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Question */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lightbulb className="w-3 h-3" />
                      <span>{QUIZ_CATEGORIES.find(c => c.id === question.category)?.name}</span>
                    </div>
                    <Badge variant={question.difficulty === 'easy' ? 'secondary' : 
                                   question.difficulty === 'medium' ? 'default' : 'destructive'}>
                      {question.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{question.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {question.options.map((option, index) => {
                    let buttonClass = "w-full justify-start text-left h-auto py-3 px-4";
                    
                    if (gameState.showResult) {
                      if (index === question.correctAnswer) {
                        buttonClass += " bg-green-100 border-green-500 text-green-700";
                      } else if (index === gameState.selectedAnswer && index !== question.correctAnswer) {
                        buttonClass += " bg-red-100 border-red-500 text-red-700";
                      }
                    }
                    
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className={buttonClass}
                        onClick={() => handleAnswer(index)}
                        disabled={gameState.showResult}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span>{option}</span>
                          {gameState.showResult && index === question.correctAnswer && (
                            <CheckCircle className="w-4 h-4 ms-auto text-green-600" />
                          )}
                          {gameState.showResult && index === gameState.selectedAnswer && index !== question.correctAnswer && (
                            <XCircle className="w-4 h-4 ms-auto text-red-600" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Explanation */}
              {gameState.showResult && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm mb-1">Explanation</p>
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                        <p className="text-xs text-primary mt-2">+{question.points} points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next Button */}
              {gameState.showResult && (
                <Button onClick={nextQuestion} className="w-full">
                  {gameState.currentQuestion < gameState.questions.length - 1 ? 'Next Question' : 'See Results'}
                </Button>
              )}
            </>
          ) : (
            <QuizResults 
              stats={stats!}
              score={gameState.score}
              totalQuestions={gameState.questions.length}
              onPlayAgain={startNewQuiz}
              onBackToMenu={() => setGameMode('menu')}
              newAchievements={newAchievements}
              showAchievements={showAchievements}
              setShowAchievements={setShowAchievements}
            />
          )}
        </div>
      </div>
    </LayoutManager>
  );
}

// Quiz Menu Component
function QuizMenu({ 
  onStartQuiz, 
  selectedCategory, 
  setSelectedCategory, 
  selectedDifficulty, 
  setSelectedDifficulty,
  stats,
  powerUps,
  onShowAchievements 
}: any) {
  return (
    <LayoutManager>
      <div className="min-h-screen bg-background">
        <AppBar title="Islamic Quiz" showBack />
        
        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Player Stats */}
          {stats && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <span className="font-bold">Level {stats.level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">{stats.xp} XP</span>
                  </div>
                </div>
                <Progress value={quizManager.getLevelProgress().progress} className="h-2 mb-2" />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-bold text-primary">{stats.totalGames}</p>
                    <p className="text-muted-foreground">Games</p>
                  </div>
                  <div>
                    <p className="font-bold text-primary">{stats.bestStreak}</p>
                    <p className="text-muted-foreground">Best Streak</p>
                  </div>
                  <div>
                    <p className="font-bold text-primary">{stats.dailyStreak}</p>
                    <p className="text-muted-foreground">Daily Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Category</CardTitle>
              <CardDescription>Choose your area of knowledge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUIZ_CATEGORIES.filter(c => c.unlocked).map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="w-full justify-start"
                >
                  <span className="mr-2">{category.icon}</span>
                  <span>{category.name}</span>
                  {stats?.categoryMastery[category.id] && (
                    <Badge variant="secondary" className="ml-auto">
                      {stats.categoryMastery[category.id]}%
                    </Badge>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Difficulty Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Difficulty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['all', 'easy', 'medium', 'hard'].map(difficulty => (
                <Button
                  key={difficulty}
                  variant={selectedDifficulty === difficulty ? "default" : "outline"}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className="w-full justify-start capitalize"
                >
                  {difficulty === 'all' ? 'All Difficulties' : difficulty}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Power-ups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Power-ups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {powerUps.map(powerUp => (
                <div key={powerUp.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{powerUp.icon}</span>
                    <span className="text-sm">{powerUp.name}</span>
                  </div>
                  <Badge variant={powerUp.uses > 0 ? "default" : "secondary"}>
                    {powerUp.uses}/{powerUp.maxUses}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Achievements Button */}
          <Button onClick={onShowAchievements} variant="outline" className="w-full">
            <Trophy className="w-4 h-4 mr-2" />
            View Achievements
          </Button>

          {/* Start Button */}
          <Button onClick={onStartQuiz} className="w-full" size="lg">
            <Target className="w-4 h-4 mr-2" />
            Start Quiz
          </Button>
        </div>
      </div>
    </LayoutManager>
  );
}

// Quiz Results Component
function QuizResults({ 
  stats, 
  score, 
  totalQuestions, 
  onPlayAgain, 
  onBackToMenu,
  newAchievements,
  showAchievements,
  setShowAchievements 
}: any) {
  const accuracy = Math.round((score / totalQuestions) * 100);
  const xpEarned = score * 10 + (score === totalQuestions ? 50 : 0);
  
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 text-center">
          <Award className="w-16 h-16 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-4xl font-bold text-primary mb-2">
            {score} / {totalQuestions}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {accuracy >= 90 ? "Excellent! Ma sha Allah!" : 
             accuracy >= 70 ? "Good job! Keep learning!" : 
             accuracy >= 50 ? "Nice effort! Review and try again!" : 
             "Keep studying! You'll improve!"}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>+{xpEarned} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>{accuracy}% Accuracy</span>
            </div>
          </div>
        </div>
      </Card>

      {/* New Achievements */}
      {newAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-500" />
              New Achievements!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {newAchievements.map(achievement => (
              <div key={achievement.id} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  +{achievement.points} XP
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.totalGames}</p>
              <p className="text-xs text-muted-foreground">Total Games</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.level}</p>
              <p className="text-xs text-muted-foreground">Current Level</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.bestStreak}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.dailyStreak}</p>
              <p className="text-xs text-muted-foreground">Daily Streak</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={onPlayAgain} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            <Button onClick={onBackToMenu} variant="outline" className="flex-1">
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
