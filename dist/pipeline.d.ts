export declare type Next = () => Promise<void> | void;
export declare type Middleware<T> = (context: T, next: Next) => Promise<void> | void;
export declare type Pipeline<T> = {
    push: (...middlewares: Middleware<T>[]) => void;
    execute: (context: T) => Promise<any>;
};
export declare function Pipeline<T>(...middlewares: Middleware<T>[]): Pipeline<T>;
