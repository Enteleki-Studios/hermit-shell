import type { Hermit, Utility } from '../'

export const help = (hermit: Hermit): Utility => [
    'help',
    () => {
        const utilities = hermit.utilities.keys().toArray().sort().join('\n\t')

        return 'Welcome to Hermit Shell! Available utilities:\n\t' + utilities
    },
]
