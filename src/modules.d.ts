declare module 'tailwindcss/defaultConfig.js' {
  type Screens = 'sm' | 'md' | 'lg' | 'xl'
  type Range = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  interface TailwindConfig {
    prefix: string
    important: boolean
    separator: string
    theme: {
      screens: Record<Screens, string>
      colors: {
        transparent: string

        black: string
        white: string

        gray: Record<Range, string>
        red: Record<Range, string>
        orange: Record<Range, string>
        yellow: Record<Range, string>
        green: Record<Range, string>
        teal: Record<Range, string>
        blue: Record<Range, string>
        indigo: Record<Range, string>
        purple: Record<Range, string>
        pink: Record<Range, string>
      }
    }
  }
  const config: TailwindConfig
  export default config
}

declare module 'tailwindcss/resolveConfig' {
  import defaultConfig from 'tailwindcss/defaultConfig.js'
  const resolveConfig: <T>(config: T) => T & typeof defaultConfig
  export default resolveConfig
}
