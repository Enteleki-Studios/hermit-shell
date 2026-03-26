type State = {
    args: string[]
    current: string
    inQuotes: '"' | "'" | null
}

export const parseArgs = (input: string): string[] => {
    const result = input.split('').reduce<State>(
        (state, char) => {
            const { args, current, inQuotes } = state

            // In quotes
            if (inQuotes) {
                return char === inQuotes
                    ? { args, current, inQuotes: null } // Finish quoted string
                    : { args, current: current + char, inQuotes } // Include spaces when in quotes
            }

            // Not in quotes
            if (char === '"' || char === "'") {
                return {
                    ...state,
                    inQuotes: char, // Start quoted string
                }
            }

            // Arg is finished
            if (char === ' ') {
                return current.length > 0
                    ? { args: [...args, current], current: '', inQuotes }
                    : state // Ignore multiple spaces between args
            }

            // Add char to current arg
            return { args, current: current + char, inQuotes }
        },
        { args: [], current: '', inQuotes: null },
    )

    if (result.current.length > 0) {
        return [...result.args, result.current]
    }

    return result.args
}
