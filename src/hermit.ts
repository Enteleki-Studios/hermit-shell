import type { Utility } from '.'
import { parseArgs } from './parseArgs'

type Callback = () => void

const OVERRIDE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const
type MethodName = (typeof OVERRIDE_METHODS)[number]
type ConsoleMethod = Console[MethodName]

type LogEntry = {
    id: number
    timestamp: number
    severity: string
    content: string
}

export class Hermit {
    private log: LogEntry[] = []
    private observers = new Set<Callback>()
    private originalConsoleMethods = new Map<MethodName, ConsoleMethod | undefined>()
    private _utilities = new Map<string, Utility[1]>()
    private nextId = 1

    private onUpdate() {
        this.observers.forEach((cb) => {
            cb()
        })
    }

    get utilities() {
        return this._utilities
    }

    addUtility(utility: Utility) {
        this.utilities.set(utility[0], utility[1])
    }

    eval(input: string) {
        return new Promise<void>((resolve) => {
            this.newEntry(input, 'input')

            const args = parseArgs(input)

            if (args[0]) {
                const utility = this.utilities.get(args[0])
                if (utility) {
                    const result = utility(args)
                    this.newEntry(result, 'result')
                } else {
                    this.newEntry(`Utility not found: ${args[0]}`, 'error')
                }
            } else {
                this.newEntry('No args parsed', 'error')
            }

            resolve()
        })
    }

    newEntry(content: string | undefined, severity?: string) {
        this.log = [
            ...this.log,
            {
                id: this.nextId,
                timestamp: Date.now(),
                severity: severity ?? 'log',
                content: content ?? 'undefined',
            },
        ]
        this.nextId += 1
        this.onUpdate()
    }

    interceptConsole() {
        OVERRIDE_METHODS.forEach((methodName) => {
            this.originalConsoleMethods.set(methodName, window.console[methodName])

            window.console[methodName] = (...args) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Follows the args type for console
                this.originalConsoleMethods.get(methodName)?.(...args)

                const content = args
                    .map((a: unknown) => {
                        if (a === null) {
                            return 'null'
                        }
                        if (a === undefined) {
                            return 'undefined'
                        }
                        if (typeof a === 'string') {
                            return a
                        }
                        if (typeof a === 'number') {
                            return a.toString()
                        }
                        return JSON.stringify(a)
                    })
                    .join(' ')

                this.newEntry(content, methodName)
            }
        })
    }

    releaseConsole() {
        this.originalConsoleMethods.entries().forEach(([methodName, originalMethod]) => {
            if (originalMethod) {
                window.console[methodName] = originalMethod
                this.originalConsoleMethods.set(methodName, undefined)
            }
        })
    }

    getLog = () => {
        return this.log
    }

    subscribe = (cb: Callback) => {
        this.observers.add(cb)

        return () => {
            this.observers.delete(cb)
        }
    }
}
