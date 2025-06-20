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
    lineAnimationDuration: 0.3, // Each line takes 30% of reveal duration (increased for more bounce time)
    translateY: 100, // pixels (increased for more dramatic bounce)
    staggerDelay: 0.15, // seconds between line animations (slightly reduced for tighter timing)
    bounceIntensity: 2.2, // back.out bounce intensity (increased for more organic feel)
    scaleStart: 0.8, // starting scale for bounce effect
  },
  cta: {
    startOffset: 0.7, // Start at 70% of answer phase
    duration: 0.3, // 30% of answer phase
    translateY: 30, // pixels
  },
} as const

export function calculateVideoDuration (questionLines: number, answerLines: number, questionText?: string): number {
  // Calculate typewriter duration based on actual question text length if provided
  let typewriterDuration = 0
  if (questionText) {
    typewriterDuration = questionText.length * ANIMATION_CONFIG.typewriter.characterDelay
  }
  else {
    // Fallback to estimation if no text provided
    const estimatedQuestionLength = questionLines * 50
    typewriterDuration = estimatedQuestionLength * ANIMATION_CONFIG.typewriter.characterDelay
  }

  const questionDuration = Math.max(2, Math.max(
    questionLines * ANIMATION_CONFIG.questionDisplayTime,
    typewriterDuration + 1, // Add 1 second buffer after typing
  ))

  const answerDuration = Math.max(4, answerLines * ANIMATION_CONFIG.answerRevealDuration)
  return questionDuration + ANIMATION_CONFIG.transitionDuration + answerDuration + ANIMATION_CONFIG.holdDuration
}
