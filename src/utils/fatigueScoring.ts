import { AssessmentBatteryData, AssessmentReportData, FatigueDimensionScore, SubjectiveFatigueRecord } from '../types';

/**
 * Transparent, explainable rule-based fatigue index computation.
 * Weights:
 * - Hand Stability: 25%
 * - Motor Endurance (Tapping decrement & rate loss): 30%
 * - Reaction Ability (Latency shift): 20%
 * - Fine Motor Control (Tracing error & smoothness loss): 25%
 *
 * Subjective Fatigue Rating is recorded as an independent experimental multidimensional metric,
 * but is NOT used as weighting basis for the objective fatigueIndex.
 */
export function calculateFatigueScores(
  baseline: AssessmentBatteryData,
  post: AssessmentBatteryData,
  subjectId: string = 'Subject 001',
  challengeDurationSec: number = 30,
  challengeTaps: number = 142,
  subjectiveFatigue?: SubjectiveFatigueRecord
): AssessmentReportData {
  // 1. Hand Stability Dimension (Weight: 25%)
  // Baseline stability score vs Post stability score
  const baseStab = baseline.stability.stabilityScore;
  const postStab = post.stability.stabilityScore;
  // Decrease in score indicates fatigue
  const stabScoreDrop = Math.max(0, baseStab - postStab);
  // Also consider motion RMS increase
  const rmsRatio = (post.stability.motionRMS - baseline.stability.motionRMS) / (baseline.stability.motionRMS || 0.05);
  const stabFatigueIdx = Math.min(100, Math.max(0, Math.round(stabScoreDrop * 2.2 + Math.max(0, rmsRatio * 45))));

  const handStabilityDim: FatigueDimensionScore = {
    name: 'Hand Stability',
    baseline: baseStab,
    postFatigue: postStab,
    change: Number((((postStab - baseStab) / baseStab) * 100).toFixed(1)),
    dimensionFatigueIndex: stabFatigueIdx
  };

  // 2. Motor Endurance Dimension (Weight: 30%)
  // Tapping rate drop & Performance decrement shift
  const baseTapRate = baseline.tapping.tapRate;
  const postTapRate = post.tapping.tapRate;
  const tapRateDrop = Math.max(0, ((baseTapRate - postTapRate) / (baseTapRate || 1)) * 100);
  const decrementDiff = Math.max(0, post.tapping.performanceDecrement - baseline.tapping.performanceDecrement);
  const rhythmCVDrop = Math.max(0, post.tapping.rhythmCV - baseline.tapping.rhythmCV);

  // Normalizing to 0-100 score (high score = more fatigue)
  const enduranceFatigueIdx = Math.min(100, Math.max(0, Math.round(tapRateDrop * 1.8 + decrementDiff * 1.2 + rhythmCVDrop * 1.5)));
  // Capacity representation: 100 - fatigue
  const motorEnduranceDim: FatigueDimensionScore = {
    name: 'Motor Endurance',
    baseline: Math.round(Math.max(40, 100 - baseline.tapping.performanceDecrement * 0.8)),
    postFatigue: Math.round(Math.max(20, 100 - (baseline.tapping.performanceDecrement * 0.8 + enduranceFatigueIdx * 0.4))),
    change: Number((((postTapRate - baseTapRate) / (baseTapRate || 1)) * 100).toFixed(1)),
    dimensionFatigueIndex: enduranceFatigueIdx
  };

  // 3. Reaction Ability Dimension (Weight: 20%)
  // Reaction time increase
  const baseRx = baseline.reaction.medianReactionMs;
  const postRx = post.reaction.medianReactionMs;
  const rxIncreasePct = ((postRx - baseRx) / (baseRx || 1)) * 100;
  const reactionFatigueIdx = Math.min(100, Math.max(0, Math.round(Math.max(0, rxIncreasePct) * 3.2)));

  const reactionAbilityDim: FatigueDimensionScore = {
    name: 'Reaction Ability',
    baseline: Math.round(Math.max(40, 100 - (baseRx - 200) * 0.25)),
    postFatigue: Math.round(Math.max(20, 100 - (postRx - 200) * 0.25)),
    change: Number(rxIncreasePct.toFixed(1)),
    dimensionFatigueIndex: reactionFatigueIdx
  };

  // 4. Fine Motor Control Dimension (Weight: 25%)
  // Tracing RMSE increase & Smoothness decrease
  const baseSmooth = baseline.tracing.smoothness;
  const postSmooth = post.tracing.smoothness;
  const rmseIncreasePct = ((post.tracing.pathRMSE - baseline.tracing.pathRMSE) / (baseline.tracing.pathRMSE || 1)) * 100;
  const smoothDrop = Math.max(0, baseSmooth - postSmooth);
  const fineMotorFatigueIdx = Math.min(100, Math.max(0, Math.round(Math.max(0, rmseIncreasePct) * 0.45 + smoothDrop * 1.2)));

  const fineMotorControlDim: FatigueDimensionScore = {
    name: 'Fine Motor Control',
    baseline: baseSmooth,
    postFatigue: postSmooth,
    change: Number((((postSmooth - baseSmooth) / (baseSmooth || 1)) * 100).toFixed(1)),
    dimensionFatigueIndex: fineMotorFatigueIdx
  };

  // Weighted overall Fatigue Index:
  // Stability: 25%, Endurance: 30%, Reaction: 20%, Fine Motor: 25%
  const compositeIndex = Math.round(
    handStabilityDim.dimensionFatigueIndex * 0.25 +
    motorEnduranceDim.dimensionFatigueIndex * 0.30 +
    reactionAbilityDim.dimensionFatigueIndex * 0.20 +
    fineMotorControlDim.dimensionFatigueIndex * 0.25
  );

  const finalFatigueIndex = Math.max(5, Math.min(96, compositeIndex));

  let fatigueLevel: 'Low' | 'Mild' | 'Moderate' | 'High' = 'Low';
  if (finalFatigueIndex >= 75) {
    fatigueLevel = 'High';
  } else if (finalFatigueIndex >= 50) {
    fatigueLevel = 'Moderate';
  } else if (finalFatigueIndex >= 25) {
    fatigueLevel = 'Mild';
  }

  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return {
    id: `SES-${Date.now().toString(36).toUpperCase()}`,
    subjectId,
    timestamp: Date.now(),
    dateString,
    fatigueIndex: finalFatigueIndex,
    fatigueLevel,
    dimensions: {
      handStability: handStabilityDim,
      reactionAbility: reactionAbilityDim,
      motorEndurance: motorEnduranceDim,
      fineMotorControl: fineMotorControlDim
    },
    baseline,
    postFatigue: post,
    challengeDurationSec,
    challengeTaps,
    subjectiveFatigue
  };
}

export const calculateFatigueAssessment = calculateFatigueScores;
