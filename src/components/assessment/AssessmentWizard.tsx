import React, { useState } from 'react';
import { 
  AssessmentStep, 
  AssessmentBatteryData, 
  HandStabilityMetrics, 
  TappingMetrics, 
  ReactionMetrics, 
  TracingMetrics, 
  AssessmentReportData,
  SubjectiveFatigueRecord
} from '../../types';
import { CalibrationStep } from './CalibrationStep';
import { HandStabilityStep } from './HandStabilityStep';
import { FingerTappingStep } from './FingerTappingStep';
import { ReactionStep } from './ReactionStep';
import { SpiralTracingStep } from './SpiralTracingStep';
import { FatigueChallengeStep } from './FatigueChallengeStep';
import { SubjectiveAssessmentStep } from './SubjectiveAssessmentStep';
import { calculateFatigueAssessment } from '../../utils/fatigueScoring';
import { StorageService } from '../../services/storage';
import { getSensorService } from '../../services/sensorSimulator';
import { createDefaultStabilityMetrics } from '../../utils/signalProcessing';
import { createDefaultTappingMetrics } from '../../utils/tappingAnalysis';
import { createDefaultTracingMetrics } from '../../utils/tracingAnalysis';
import { Check, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n/context';

interface AssessmentWizardProps {
  subjectId: string;
  onComplete: (report: AssessmentReportData) => void;
  onCancel: () => void;
}

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({
  subjectId,
  onComplete,
  onCancel
}) => {
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState<AssessmentStep>(AssessmentStep.CALIBRATION);

  // Collected Baseline Data
  const [baselineStability, setBaselineStability] = useState<HandStabilityMetrics | null>(null);
  const [baselineTapping, setBaselineTapping] = useState<TappingMetrics | null>(null);
  const [baselineReaction, setBaselineReaction] = useState<ReactionMetrics | null>(null);
  const [baselineTracing, setBaselineTracing] = useState<TracingMetrics | null>(null);

  // Fatigue challenge specs
  const [challengeDuration, setChallengeDuration] = useState<number>(30);
  const [challengeTaps, setChallengeTaps] = useState<number>(138);

  // Collected Post-Fatigue Data
  const [postStability, setPostStability] = useState<HandStabilityMetrics | null>(null);
  const [postTapping, setPostTapping] = useState<TappingMetrics | null>(null);
  const [postReaction, setPostReaction] = useState<ReactionMetrics | null>(null);
  const [postTracing, setPostTracing] = useState<TracingMetrics | null>(null);

  const sensor = getSensorService();

  // Step 0: Calibration Done
  const handleCalibrationComplete = () => {
    sensor.setFatigueFactor(0.0);
    setCurrentStep(AssessmentStep.BASELINE_STABILITY);
  };

  // Step 1: Baseline Stability Done
  const handleBaselineStabilityComplete = (metrics: HandStabilityMetrics) => {
    setBaselineStability(metrics);
    setCurrentStep(AssessmentStep.BASELINE_TAPPING);
  };

  // Step 2: Baseline Tapping Done
  const handleBaselineTappingComplete = (metrics: TappingMetrics) => {
    setBaselineTapping(metrics);
    setCurrentStep(AssessmentStep.BASELINE_REACTION);
  };

  // Step 3: Baseline Reaction Done
  const handleBaselineReactionComplete = (metrics: ReactionMetrics) => {
    setBaselineReaction(metrics);
    setCurrentStep(AssessmentStep.BASELINE_TRACING);
  };

  // Step 4: Baseline Tracing Done
  const handleBaselineTracingComplete = (metrics: TracingMetrics) => {
    setBaselineTracing(metrics);
    setCurrentStep(AssessmentStep.FATIGUE_CHALLENGE);
  };

  // Step 5: Fatigue Challenge Done
  const handleFatigueChallengeComplete = (durationSec: number, totalTaps: number) => {
    setChallengeDuration(durationSec);
    setChallengeTaps(totalTaps);
    // Increase synthetic micro-motion perturbation on sensor simulator
    sensor.setFatigueFactor(0.7);
    setCurrentStep(AssessmentStep.POST_STABILITY);
  };

  // Step 6: Post Stability Done
  const handlePostStabilityComplete = (metrics: HandStabilityMetrics) => {
    setPostStability(metrics);
    setCurrentStep(AssessmentStep.POST_TAPPING);
  };

  // Step 7: Post Tapping Done
  const handlePostTappingComplete = (metrics: TappingMetrics) => {
    setPostTapping(metrics);
    setCurrentStep(AssessmentStep.POST_REACTION);
  };

  // Step 8: Post Reaction Done
  const handlePostReactionComplete = (metrics: ReactionMetrics) => {
    setPostReaction(metrics);
    setCurrentStep(AssessmentStep.POST_TRACING);
  };

  // Step 9: Post Tracing Done -> Advance to Step 10: Subjective Fatigue Rating (疲劳自评)
  const handlePostTracingComplete = (metrics: TracingMetrics) => {
    setPostTracing(metrics);
    setCurrentStep(AssessmentStep.SUBJECTIVE_RATING);
  };

  // Step 10: Subjective Fatigue Rating Done -> FINALIZE REPORT
  const handleSubjectiveComplete = (subjectiveRecord: SubjectiveFatigueRecord) => {
    // Fallbacks if user skipped anything
    const baseData: AssessmentBatteryData = {
      stability: baselineStability || createDefaultStabilityMetrics(false),
      tapping: baselineTapping || createDefaultTappingMetrics(false),
      reaction: baselineReaction || {
        trials: [],
        meanReactionMs: 279,
        medianReactionMs: 284,
        bestReactionMs: 238,
        worstReactionMs: 351,
        missRate: 0
      },
      tracing: baselineTracing || createDefaultTracingMetrics(false)
    };

    const postData: AssessmentBatteryData = {
      stability: postStability || createDefaultStabilityMetrics(true),
      tapping: postTapping || createDefaultTappingMetrics(true),
      reaction: postReaction || {
        trials: [],
        meanReactionMs: 334,
        medianReactionMs: 337,
        bestReactionMs: 318,
        worstReactionMs: 388,
        missRate: 0
      },
      tracing: postTracing || createDefaultTracingMetrics(true)
    };

    // Calculate final scores:
    // Subjective fatigue self-rating is stored as an independent multidimensional experimental variable,
    // and is NOT factored into the objective physiological fatigue index calculation.
    const report = calculateFatigueAssessment(
      baseData,
      postData,
      subjectId,
      challengeDuration,
      challengeTaps,
      subjectiveRecord
    );

    // Link report id to subjective record
    subjectiveRecord.linkedSessionId = report.id;

    // Persist session report
    StorageService.saveSession(report);

    // Persist subjective fatigue record
    StorageService.saveSubjectiveFatigueRecord(subjectiveRecord);

    // Reset sensor back to normal resting
    sensor.setFatigueFactor(0.0);

    // Transition to report view
    onComplete(report);
  };

  const handleSkipSubjective = () => {
    const defaultRecord: SubjectiveFatigueRecord = {
      id: `SUB-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
      rating: 5,
      level: 'moderate',
      sensations: [],
      note: locale === 'zh' ? '受试者未作自评 (以中位数记录)' : 'Participant skipped self-rating (recorded as neutral)'
    };
    handleSubjectiveComplete(defaultRecord);
  };

  // Step breadcrumb helper: 测验1 (基准 4项) + 疲劳诱发 + 测验2 (复测 4项) + 疲劳自评 (多维指标采集)
  const stepTitles: { [key in AssessmentStep]: { title: string; category: string; stepNumber: number } } = {
    [AssessmentStep.CALIBRATION]: { 
      title: locale === 'zh' ? '传感器调零与基准校准' : 'Sensor Tare & Calibration', 
      category: locale === 'zh' ? '准备阶段' : 'Preparation', 
      stepNumber: 0 
    },
    [AssessmentStep.BASELINE_STABILITY]: { 
      title: locale === 'zh' ? '基准手部姿态稳定性 (IMU)' : 'Hand Stability (Resting IMU)', 
      category: locale === 'zh' ? '测验 1 (基准 1/4)' : 'Test 1 (Base 1/4)', 
      stepNumber: 1 
    },
    [AssessmentStep.BASELINE_TAPPING]: { 
      title: locale === 'zh' ? '基准双靶手指交替敲击耐力' : 'Finger Tapping Endurance', 
      category: locale === 'zh' ? '测验 1 (基准 2/4)' : 'Test 1 (Base 2/4)', 
      stepNumber: 2 
    },
    [AssessmentStep.BASELINE_REACTION]: { 
      title: locale === 'zh' ? '基准视觉神经反应时测试' : 'Visual Reaction Latency', 
      category: locale === 'zh' ? '测验 1 (基准 3/4)' : 'Test 1 (Base 3/4)', 
      stepNumber: 3 
    },
    [AssessmentStep.BASELINE_TRACING]: { 
      title: locale === 'zh' ? '基准阿基米德螺旋精细描摹' : 'Archimedean Spiral Tracing', 
      category: locale === 'zh' ? '测验 1 (基准 4/4)' : 'Test 1 (Base 4/4)', 
      stepNumber: 4 
    },
    [AssessmentStep.FATIGUE_CHALLENGE]: { 
      title: locale === 'zh' ? '高强度神经肌肉运动负荷挑战' : 'Repetitive Motor Load', 
      category: locale === 'zh' ? '疲劳诱发阶段' : 'Fatigue Challenge', 
      stepNumber: 5 
    },
    [AssessmentStep.POST_STABILITY]: { 
      title: locale === 'zh' ? '负荷后手部姿态稳定性复测' : 'Post Hand Stability', 
      category: locale === 'zh' ? '测验 2 (复测 1/4)' : 'Test 2 (Post 1/4)', 
      stepNumber: 6 
    },
    [AssessmentStep.POST_TAPPING]: { 
      title: locale === 'zh' ? '负荷后手指交替敲击耐力复测' : 'Post Finger Tapping', 
      category: locale === 'zh' ? '测验 2 (复测 2/4)' : 'Test 2 (Post 2/4)', 
      stepNumber: 7 
    },
    [AssessmentStep.POST_REACTION]: { 
      title: locale === 'zh' ? '负荷后视觉反应潜伏期复测' : 'Post Reaction Latency', 
      category: locale === 'zh' ? '测验 2 (复测 3/4)' : 'Test 2 (Post 3/4)', 
      stepNumber: 8 
    },
    [AssessmentStep.POST_TRACING]: { 
      title: locale === 'zh' ? '负荷后螺旋精细描摹复测' : 'Post Spiral Tracing', 
      category: locale === 'zh' ? '测验 2 (复测 4/4)' : 'Test 2 (Post 4/4)', 
      stepNumber: 9 
    },
    [AssessmentStep.SUBJECTIVE_RATING]: { 
      title: locale === 'zh' ? '主观疲劳状态自评 (多维实验采集)' : 'Subjective Fatigue Self-Rating', 
      category: locale === 'zh' ? '多维实验指标采集' : 'Multidimensional Metric', 
      stepNumber: 10 
    },
    [AssessmentStep.REPORT]: { 
      title: locale === 'zh' ? '多模态评估报告' : 'Assessment Report', 
      category: locale === 'zh' ? '评测完成' : 'Conclusion', 
      stepNumber: 11 
    }
  };

  const currentStepInfo = stepTitles[currentStep] || { 
    title: locale === 'zh' ? '评测环节' : 'Assessment', 
    category: '', 
    stepNumber: 1 
  };

  return (
    <div className="space-y-6">
      {/* Battery Stepper Header */}
      <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 font-mono font-bold text-sm">
            {currentStepInfo.stepNumber}/10
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {currentStepInfo.category} · {subjectId}
            </div>
            <div className="text-sm font-bold text-slate-900">
              {currentStepInfo.title}
            </div>
          </div>
        </div>

        {/* Global Battery Stepper Dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
            const isPassed = currentStepInfo.stepNumber > num;
            const isCurrent = currentStepInfo.stepNumber === num;
            return (
              <div
                key={num}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'w-6 bg-cyan-600'
                    : isPassed
                    ? 'w-3 bg-emerald-500'
                    : 'w-2 bg-slate-200'
                }`}
                title={`Step ${num}`}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1"
        >
          {locale === 'zh' ? '退出评测' : 'Exit Assessment'}
        </button>
      </div>

      {/* Dynamic Step Component Rendering */}
      <div>
        {currentStep === AssessmentStep.CALIBRATION && (
          <CalibrationStep onComplete={handleCalibrationComplete} />
        )}

        {currentStep === AssessmentStep.BASELINE_STABILITY && (
          <HandStabilityStep
            isPostFatigue={false}
            onComplete={handleBaselineStabilityComplete}
            onSkip={() => handleBaselineStabilityComplete(createDefaultStabilityMetrics(false))}
          />
        )}

        {currentStep === AssessmentStep.BASELINE_TAPPING && (
          <FingerTappingStep
            isPostFatigue={false}
            onComplete={handleBaselineTappingComplete}
            onBack={() => setCurrentStep(AssessmentStep.BASELINE_STABILITY)}
            onSkip={() => handleBaselineTappingComplete(createDefaultTappingMetrics(false))}
          />
        )}

        {currentStep === AssessmentStep.BASELINE_REACTION && (
          <ReactionStep
            isPostFatigue={false}
            onComplete={handleBaselineReactionComplete}
            onBack={() => setCurrentStep(AssessmentStep.BASELINE_TAPPING)}
            onSkip={() => handleBaselineReactionComplete({
              trials: [],
              meanReactionMs: 279,
              medianReactionMs: 284,
              bestReactionMs: 238,
              worstReactionMs: 351,
              missRate: 0
            })}
          />
        )}

        {currentStep === AssessmentStep.BASELINE_TRACING && (
          <SpiralTracingStep
            isPostFatigue={false}
            onComplete={handleBaselineTracingComplete}
            onBack={() => setCurrentStep(AssessmentStep.BASELINE_REACTION)}
            onSkip={() => handleBaselineTracingComplete(createDefaultTracingMetrics(false))}
          />
        )}

        {currentStep === AssessmentStep.FATIGUE_CHALLENGE && (
          <FatigueChallengeStep
            onComplete={handleFatigueChallengeComplete}
            onSkip={() => handleFatigueChallengeComplete(30, 138)}
          />
        )}

        {currentStep === AssessmentStep.POST_STABILITY && (
          <HandStabilityStep
            isPostFatigue={true}
            onComplete={handlePostStabilityComplete}
            onSkip={() => handlePostStabilityComplete(createDefaultStabilityMetrics(true))}
          />
        )}

        {currentStep === AssessmentStep.POST_TAPPING && (
          <FingerTappingStep
            isPostFatigue={true}
            onComplete={handlePostTappingComplete}
            onBack={() => setCurrentStep(AssessmentStep.POST_STABILITY)}
            onSkip={() => handlePostTappingComplete(createDefaultTappingMetrics(true))}
          />
        )}

        {currentStep === AssessmentStep.POST_REACTION && (
          <ReactionStep
            isPostFatigue={true}
            onComplete={handlePostReactionComplete}
            onBack={() => setCurrentStep(AssessmentStep.POST_TAPPING)}
            onSkip={() => handlePostReactionComplete({
              trials: [],
              meanReactionMs: 334,
              medianReactionMs: 337,
              bestReactionMs: 318,
              worstReactionMs: 388,
              missRate: 0
            })}
          />
        )}

        {currentStep === AssessmentStep.POST_TRACING && (
          <SpiralTracingStep
            isPostFatigue={true}
            onComplete={handlePostTracingComplete}
            onBack={() => setCurrentStep(AssessmentStep.POST_REACTION)}
            onSkip={() => handlePostTracingComplete(createDefaultTracingMetrics(true))}
          />
        )}

        {currentStep === AssessmentStep.SUBJECTIVE_RATING && (
          <SubjectiveAssessmentStep
            onComplete={handleSubjectiveComplete}
            onBack={() => setCurrentStep(AssessmentStep.POST_TRACING)}
            onSkip={handleSkipSubjective}
            initialRating={5}
          />
        )}
      </div>
    </div>
  );
};
