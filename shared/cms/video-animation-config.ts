/**
 * Animation timing config + duration calculator for the AMA video
 * generator. Pure data + math, no DOM access.
 */
export const ANIMATION_CONFIG = {
  frameRate: 60,
  recordingFrameRate: 24,
  questionDisplayTime: 0.8, // seconds per line of question
  transitionDuration: 0.4, // seconds for transition
  answerRevealDuration: 0.6, // seconds per line of answer
  holdDuration: 0.5, // seconds for hold

  positioning: {
    questionFinalOpacity: 0.1,
    questionTransitionOpacity: 0.1,
  },
  typewriter: {
    characterDelay: 0.03, // seconds between each character
  },
  answer: {
    lineAnimationDuration: 0.3,
    translateY: 100,
    staggerDelay: 0.15,
    bounceIntensity: 2.2,
    scaleStart: 0.8,
  },
  cta: {
    startOffset: 0.7,
    duration: 0.3,
    translateY: 30,
  },
} as const

export function calculateVideoDuration (questionLines: number, answerLines: number, questionText?: string, typingIntervals?: number[]): number {
  let typewriterDuration = 0
  if (typingIntervals && typingIntervals.length > 0) {
    typewriterDuration = typingIntervals.reduce((sum, interval) => sum + interval, 0) / 1000
  }
  else if (questionText) {
    typewriterDuration = questionText.length * ANIMATION_CONFIG.typewriter.characterDelay
  }
  else {
    const estimatedQuestionLength = questionLines * 50
    typewriterDuration = estimatedQuestionLength * ANIMATION_CONFIG.typewriter.characterDelay
  }

  const questionDuration = Math.max(2, Math.max(
    questionLines * ANIMATION_CONFIG.questionDisplayTime,
    typewriterDuration + 1,
  ))

  const answerDuration = Math.max(4, answerLines * ANIMATION_CONFIG.answerRevealDuration)
  return questionDuration + ANIMATION_CONFIG.transitionDuration + answerDuration + ANIMATION_CONFIG.holdDuration
}
