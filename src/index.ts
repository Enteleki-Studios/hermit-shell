export * from './hermit'
export * from './utilities/echo'
export * from './utilities/help'

export type Utility = [string, (args: string[]) => string | undefined]
