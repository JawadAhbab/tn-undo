import { ReactElement } from 'react';
export type ObjectOf<T> = {
    [key: string]: T;
};
export type ObjectInKeys<T extends Object, U> = {
    [key in keyof T]: U;
};
export type ObjectInUnion<T extends string, U> = {
    [key in T]: U;
};
export type Optional<O extends {}> = {
    [K in keyof O]?: O[K] extends {} ? Optional<O[K]> : O[K];
};
export type OptionLess<O extends {}> = {
    [K in keyof O]-?: O[K] extends {} ? OptionLess<O[K]> : O[K];
};
export type OptionalShallow<O extends {}> = {
    [K in keyof O]?: O[K];
};
export type OptionLessShallow<O extends {}> = {
    [K in keyof O]-?: O[K];
};
export type AnyObject = ObjectOf<any>;
export type AnyClass = new (...args: any[]) => any;
export type JsxElement = ReactElement | string | number | null;
export type JsxElements = JsxElement | JsxElement[] | (JsxElement | JsxElement[])[];
export type JsxComponent<P extends AnyObject = {}> = (props: P) => JsxElements;
export type Nullable<T> = T | null;
export type IsEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;
export type Func = () => void;
export type AsyncFunc = () => Promise<void>;
