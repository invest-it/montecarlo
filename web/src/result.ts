export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E> = Ok<T> | Err<E>;
export const Ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const Err = <E>(error: E): Err<E> => ({ ok: false, error });

export function value<T, E>(result: Result<T, E>): T {
    if (result.ok) {
        return (result as Ok<T>).value;
    }
    throw "Unwrapped Err as Ok";
}
export function error<T, E>(result: Result<T, E>) {
    if (!result.ok) {
        return (result as Err<E>).error;
    }
    throw "Unwrapped Ok as Err";
}
