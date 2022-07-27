export type { PartiallyRequired, Expand, ExpandRecursively, Merge, Override };

type PartiallyRequired<T, Keys extends keyof T> = Required<Pick<T, Keys>> & T;
type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
  ? { [K in keyof O]: O[K] }
  : never;

type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

type Merge<T, U> = { [K in keyof T]: K extends keyof U ? U[K] : T[K] };
type Override<T, U> = Merge<T, U> & U;
// export type Override<T extends U, U> = {
//   [K in keyof U]: K extends keyof T ? U[K] : never;
// };
