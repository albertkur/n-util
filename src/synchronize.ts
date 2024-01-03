import { given } from "@nivinjoseph/n-defensive";
import { Duration } from "./duration.js";
import { Delay } from "./delay.js";
import { Mutex } from "./mutex.js";
import { ApplicationException } from "@nivinjoseph/n-exception";


export function synchronize<
    This,
    Args extends Array<any>
>(
    delay: Duration
): SynchronizeClassMethodDecorator<This, Args>;
export function synchronize<
    This,
    Args extends Array<any>
>(
    target: SynchronizeDecoratorTargetMethod<This, Args>,
    context: SynchronizeDecoratorContext<This, Args>
): SynchronizeDecoratorReplacementMethod<This, Args>;
export function synchronize<
    This,
    Args extends Array<any>
>(
    delayOrTarget: Duration | SynchronizeDecoratorTargetMethod<This, Args>,
    context?: SynchronizeDecoratorContext<This, Args>
): SynchronizeClassMethodDecorator<This, Args> | SynchronizeDecoratorReplacementMethod<This, Args>
{
    if (delayOrTarget instanceof Duration)
    {
        const delay = delayOrTarget;
        given(delay, "delay").ensureIsObject().ensureIsInstanceOf(Duration)
            .ensure(t => t.toMilliSeconds() > 0, "delay should be greater than 0ms");

        const decorator: SynchronizeClassMethodDecorator<This, Args> = function (target, context)
        {
            return createReplacementMethod(target, context, delay);
        };

        return decorator;
    }

    const target = delayOrTarget;
    if (context == null)
        throw new ApplicationException("Context should not be null or undefined");

    return createReplacementMethod(target, context, null);
}


function createReplacementMethod<
    This,
    Args extends Array<any>
>(
    target: SynchronizeDecoratorTargetMethod<This, Args>,
    context: SynchronizeDecoratorContext<This, Args>,
    delay: Duration | null
): SynchronizeDecoratorReplacementMethod<This, Args>
{
    const { name, kind } = context;
    given(kind, "kind").ensureHasValue().ensureIsString().ensure(t => t === "method", "synchronize decorated can only be used on a method");

    const mutexKey = Symbol.for(`@nivinjoseph/n-util/synchronize/${String(name)}/mutex`);

    context.addInitializer(function (this)
    {
        (<any>this)[mutexKey] = new Mutex();
    });

    return async function (this: This, ...args: Args): Promise<any>
    {
        const mutex: Mutex = (<any>this)[mutexKey];

        await mutex.lock();
        try
        {
            const result = await target.call(this, ...args);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return result;
        }
        finally
        {
            if (delay != null)
                await Delay.milliseconds(delay.toMilliSeconds());

            mutex.release();
        }
    };
}



export type SynchronizeDecoratorTargetMethod<
    This,
    Args extends Array<any>
> = (this: This, ...args: Args) => any;

export type SynchronizeDecoratorReplacementMethod<
    This,
    Args extends Array<any>
> = (this: This, ...args: Args) => Promise<any>;

export type SynchronizeDecoratorContext<
    This,
    Args extends Array<any>
> = ClassMethodDecoratorContext<This, SynchronizeDecoratorTargetMethod<This, Args>>;


export type SynchronizeClassMethodDecorator<
    This,
    Args extends Array<any>
> = (
    value: SynchronizeDecoratorTargetMethod<This, Args>,
    context: SynchronizeDecoratorContext<This, Args>
) => SynchronizeDecoratorReplacementMethod<This, Args>;