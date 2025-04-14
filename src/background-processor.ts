import { given } from "@nivinjoseph/n-defensive";
import { Delay } from "./delay.js";
import { Disposable } from "./disposable.js";
import { ObjectDisposedException } from "@nivinjoseph/n-exception";


/**
 * A class that processes actions in the background with configurable intervals and error handling.
 * Implements the Disposable interface for proper resource cleanup.
 * 
 * @remarks
 * The processor maintains a queue of actions and processes them asynchronously.
 * It can be configured to process actions continuously or only when work is available.
 */
export class BackgroundProcessor implements Disposable
{
    private readonly _defaultErrorHandler: (e: Error) => Promise<void>;
    private readonly _breakIntervalMilliseconds: number;
    private readonly _breakOnlyWhenNoWork: boolean;
    private readonly _actionsToProcess: Array<Action> = new Array<Action>();
    private readonly _actionsExecuting: Array<Action> = new Array<Action>();
    private _isDisposed = false;
    private _timeout: any = null;


    /**
     * Gets the current number of actions waiting to be processed.
     */
    public get queueLength(): number { return this._actionsToProcess.length; }


    /**
     * Creates a new instance of the BackgroundProcessor.
     * 
     * @param defaultErrorHandler - Function to handle errors during action execution
     * @param breakIntervalMilliseconds - Time between processing attempts (default: 1000ms)
     * @param breakOnlyWhenNoWork - Whether to break only when no work is available (default: true)
     */
    public constructor(defaultErrorHandler: (e: Error) => Promise<void>, breakIntervalMilliseconds = 1000, breakOnlyWhenNoWork = true)
    {
        given(defaultErrorHandler, "defaultErrorHandler").ensureHasValue().ensureIsFunction();
        given(breakIntervalMilliseconds, "breakIntervalMilliseconds").ensureHasValue().ensureIsNumber().ensure(t => t >= 0);
        given(breakOnlyWhenNoWork, "breakOnlyWhenNoWork").ensureHasValue().ensureIsBoolean();

        this._defaultErrorHandler = defaultErrorHandler;
        this._breakIntervalMilliseconds = breakIntervalMilliseconds || 0;
        this._breakOnlyWhenNoWork = breakOnlyWhenNoWork;

        this._initiateBackgroundProcessing();
    }


    /**
     * Adds an action to the processing queue.
     * 
     * @param action - The async function to execute
     * @param errorHandler - Optional custom error handler for this action
     * @throws ObjectDisposedException if the processor has been disposed
     */
    public processAction(action: () => Promise<void>, errorHandler?: (e: Error) => Promise<void>): void
    {
        if (this._isDisposed)
            throw new ObjectDisposedException(this);

        given(action, "action").ensureHasValue().ensureIsFunction();
        given(errorHandler as Function, "errorHandler").ensureIsFunction();

        this._actionsToProcess.push(new Action(action, errorHandler || this._defaultErrorHandler));
    }


    /**
     * Disposes of the processor and optionally kills the remaining queue.
     * 
     * @param killQueue - Whether to kill the remaining queue (default: false)
     * @returns Promise that resolves when disposal is complete
     */
    public async dispose(killQueue = false): Promise<void>
    {
        if (this._isDisposed)
            return;

        this._isDisposed = true;

        if (this._timeout)
            clearTimeout(this._timeout);

        if (!killQueue)
        {
            while (this._actionsToProcess.length > 0)
            {
                const action = this._actionsToProcess.shift()!;
                this._actionsExecuting.push(action);
                action.execute(() => this._actionsExecuting.remove(action));
            }
        }

        while (this._actionsExecuting.length > 0)
            await Delay.seconds(3);
    }


    /**
     * Initiates the background processing loop.
     * This method is called automatically by the constructor.
     */
    private _initiateBackgroundProcessing(): void
    {
        if (this._isDisposed)
            return;

        let timeout = this._breakIntervalMilliseconds;
        if (this._breakOnlyWhenNoWork && this._actionsToProcess.length > 0)
            timeout = 0;

        this._timeout = setTimeout(() =>
        {
            if (this._actionsToProcess.length > 0)
            {
                const action = this._actionsToProcess.shift()!;
                this._actionsExecuting.push(action);
                action.execute(() =>
                {
                    this._actionsExecuting.remove(action);
                    this._initiateBackgroundProcessing();
                });
            }
            else
            {
                this._initiateBackgroundProcessing();
            }
        }, timeout);
    }
}


/**
 * Represents an action to be processed by the BackgroundProcessor.
 * 
 * @remarks
 * This class encapsulates an async action and its error handler.
 */
class Action
{
    private readonly _action: () => Promise<void>;
    private readonly _errorHandler: (e: Error) => Promise<void>;


    /**
     * Creates a new instance of Action.
     * 
     * @param action - The async function to execute
     * @param errorHandler - The function to handle any errors during execution
     */
    public constructor(action: () => Promise<void>, errorHandler: (e: Error) => Promise<void>)
    {
        given(action, "action").ensureHasValue().ensureIsFunction();
        given(errorHandler, "errorHandler").ensureHasValue().ensureIsFunction();

        this._action = action;
        this._errorHandler = errorHandler;
    }


    /**
     * Executes the action and handles any errors that occur.
     * 
     * @param postExecuteCallback - Callback to be called after execution completes
     */
    public execute(postExecuteCallback: () => void): void
    {
        given(postExecuteCallback, "postExecuteCallback").ensureHasValue().ensureIsFunction();

        try 
        {
            this._action()
                .then(() =>
                {
                    postExecuteCallback();
                })
                .catch((error) =>
                {
                    try 
                    {
                        this._errorHandler(error)
                            .then(() => postExecuteCallback())
                            .catch((error) =>
                            {
                                console.error(error);
                                postExecuteCallback();
                            });
                    }
                    catch (error)
                    {
                        console.error(error);
                        postExecuteCallback();
                    }
                });
        }
        catch (error)
        {
            try 
            {
                this._errorHandler(error as Error)
                    .then(() => postExecuteCallback())
                    .catch((error) =>
                    {
                        console.error(error);
                        postExecuteCallback();
                    });
            }
            catch (error)
            {
                console.error(error);
                postExecuteCallback();
            }
        }
    }
}