export type Next = () => Promise<void> | void
export interface Context<TReq, TRes> {
  request: TReq
  rout: string
  body?: TRes
}
export type Middleware<T> = (ctx: T, next: Next) => Promise<void> | void
export interface Pipeline<TC, TR> {
  push: (...mw: Middleware<TC>[]) => void
  execute: (ctx: TC) => Promise<{ body: TR }>
}
export function Pipeline<TC, TR>(...mw: Middleware<TC>[]): Pipeline<TC, TR> {
  const stack: Middleware<TC>[] = [...mw]
  const push = (...m: Middleware<TC>[]) => stack.push(...m)
  const execute = async (ctx: TC) => {
    let i = -1
    const runner = async (idx: number): Promise<void> => {
      if (idx === i) throw new Error('next() called multiple times')
      i = idx
      const fn = stack[idx]
      if (fn) await fn(ctx, () => runner(idx + 1))
    }
    await runner(0)
    if ((ctx as any).body === undefined) throw new Error('Pipeline did not set ctx.body')
    return { body: (ctx as any).body as TR }
  }
  return { push, execute }
}
