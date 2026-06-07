/**
 * GSAP timeline that drives the AMA video animation: typewriter for the
 * question, transition to a smaller window position, staggered bouncing
 * reveal of the answer lines, then the CTA. Operates on a container with
 * known child selectors (.question-window, .question-content, etc.) so
 * both the Vue editor preview and the server-rendered frames can drive
 * the same shape.
 */
import { gsap } from 'gsap'

import { ANIMATION_CONFIG } from './video-animation-config'

export interface GSAPTimeline {
  timeline: gsap.core.Timeline
  duration: number
  destroy: () => void
}

export function createGSAPTimeline (container: HTMLElement, typingIntervals?: number[]): GSAPTimeline {
  const questionWindow = container.querySelector('.question-window') as HTMLElement
  const questionContent = container.querySelector('.question-content') as HTMLElement
  const answerContainer = container.querySelector('.answer-container') as HTMLElement
  const answerLines = container.querySelectorAll('.answer-line') as NodeListOf<HTMLElement>
  const ctaContainer = container.querySelector('.cta-container') as HTMLElement

  if (!questionWindow || !questionContent || !answerContainer || !ctaContainer) {
    throw new Error('Required DOM elements not found for GSAP animation')
  }

  const questionText = questionContent.getAttribute('data-question-text') || questionContent.textContent || ''

  let typewriterDuration: number
  if (typingIntervals && typingIntervals.length > 0) {
    typewriterDuration = typingIntervals.reduce((sum, interval) => sum + interval, 0) / 1000
  }
  else {
    typewriterDuration = questionText.length * ANIMATION_CONFIG.typewriter.characterDelay
  }

  const questionDuration = Math.max(2, Math.max(
    1 * ANIMATION_CONFIG.questionDisplayTime,
    typewriterDuration + 1,
  ))
  const transitionDuration = ANIMATION_CONFIG.transitionDuration
  const answerDuration = Math.max(3, answerLines.length * ANIMATION_CONFIG.answerRevealDuration)
  const holdDuration = ANIMATION_CONFIG.holdDuration
  const totalDuration = questionDuration + transitionDuration + answerDuration + holdDuration

  const tl = gsap.timeline({
    paused: true,
    ease: 'power2.inOut',
    immediateRender: true,
    autoRemoveChildren: false,
  })

  gsap.set(questionWindow, {
    opacity: 1,
    x: '-50%',
    y: '-50%',
    transformOrigin: 'center center',
  })

  gsap.set(answerContainer, { opacity: 0 })
  gsap.set(answerLines, {
    opacity: 0,
    y: ANIMATION_CONFIG.answer.translateY,
    scale: ANIMATION_CONFIG.answer.scaleStart,
  })
  gsap.set(ctaContainer, { opacity: 0, y: ANIMATION_CONFIG.cta.translateY })

  const characters = Array.from(questionContent.querySelectorAll('.question-char')) as HTMLElement[]
  gsap.set(characters, {
    opacity: 0,
    visibility: 'hidden',
    immediateRender: true,
  })

  // Phase 1: Typewriter
  if (typingIntervals && typingIntervals.length > 0) {
    let cumulativeTime = 0
    for (let i = 0; i < characters.length && i < typingIntervals.length; i++) {
      tl.to(characters[i]!, {
        opacity: 1,
        visibility: 'visible',
        duration: 0.05,
        ease: 'none',
      }, cumulativeTime)
      cumulativeTime += typingIntervals[i]! / 1000
    }
  }
  else {
    for (let i = 0; i < characters.length; i++) {
      const charTime = i * ANIMATION_CONFIG.typewriter.characterDelay
      tl.to(characters[i]!, {
        opacity: 1,
        visibility: 'visible',
        duration: 0.1,
        ease: 'none',
      }, charTime)
    }
  }

  // Pad question phase
  const remainingQuestionDuration = Math.max(0, questionDuration - typewriterDuration)
  tl.to({}, { duration: remainingQuestionDuration }, typewriterDuration)

  // Phase 2: Slide question to bottom
  tl.to(questionWindow, {
    duration: transitionDuration,
    opacity: ANIMATION_CONFIG.positioning.questionTransitionOpacity,
    x: '-50%',
    y: '10%',
    ease: 'power2.inOut',
  }, questionDuration)

  // Phase 3: Reveal answer container + lines
  tl.to(answerContainer, {
    duration: 0.3,
    opacity: 1,
    ease: 'power2.out',
  }, questionDuration + transitionDuration)

  tl.to(answerLines, {
    duration: ANIMATION_CONFIG.answer.lineAnimationDuration,
    opacity: 1,
    y: 0,
    scale: 1,
    stagger: ANIMATION_CONFIG.answer.staggerDelay,
    ease: `back.out(${ANIMATION_CONFIG.answer.bounceIntensity})`,
  }, questionDuration + transitionDuration + 0.2)

  tl.to(questionWindow, {
    duration: 0.5,
    opacity: ANIMATION_CONFIG.positioning.questionFinalOpacity,
    ease: 'power2.out',
  }, questionDuration + transitionDuration + answerDuration * 0.6)

  // Phase 4: CTA
  tl.to(ctaContainer, {
    duration: ANIMATION_CONFIG.cta.duration,
    opacity: 1,
    y: 0,
    ease: 'back.out(1.7)',
  }, questionDuration + transitionDuration + answerDuration * ANIMATION_CONFIG.cta.startOffset)

  // Phase 5: Hold
  tl.to({}, { duration: holdDuration })

  return {
    timeline: tl,
    duration: totalDuration,
    destroy: () => {
      tl.kill()
    },
  }
}

export function createPreviewAnimation (container: HTMLElement, typingIntervals?: number[]): GSAPTimeline {
  const animation = createGSAPTimeline(container, typingIntervals)
  animation.timeline.repeat(-1)
  animation.timeline.play()
  return animation
}

export function stopAnimations (container: HTMLElement): void {
  gsap.killTweensOf(container)
  const selectors = [
    '.question-window',
    '.question-content',
    '.question-char',
    '.answer-container',
    '.answer-line',
    '.cta-container',
  ]
  for (const selector of selectors) {
    const elements = container.querySelectorAll(selector)
    for (const element of elements) {
      gsap.killTweensOf(element)
    }
  }
}

export function resetCharacterStates (container: HTMLElement): void {
  const characters = container.querySelectorAll('.question-char')
  for (const char of characters) {
    const element = char as HTMLElement
    element.style.opacity = '0'
    element.style.visibility = 'hidden'
  }

  const questionWindow = container.querySelector('.question-window') as HTMLElement
  const answerContainer = container.querySelector('.answer-container') as HTMLElement
  const answerLines = container.querySelectorAll('.answer-line') as NodeListOf<HTMLElement>
  const ctaContainer = container.querySelector('.cta-container') as HTMLElement

  if (questionWindow) {
    gsap.set(questionWindow, {
      opacity: 1,
      x: '-50%',
      y: '-50%',
      transformOrigin: 'center center',
    })
  }
  if (answerContainer) gsap.set(answerContainer, { opacity: 0 })
  if (answerLines.length > 0) {
    gsap.set(answerLines, {
      opacity: 0,
      y: ANIMATION_CONFIG.answer.translateY,
      scale: ANIMATION_CONFIG.answer.scaleStart,
    })
  }
  if (ctaContainer) gsap.set(ctaContainer, { opacity: 0, y: ANIMATION_CONFIG.cta.translateY })
}
