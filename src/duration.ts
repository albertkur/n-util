import { given } from "@nivinjoseph/n-defensive";

/**
 * A class for handling time durations in various units.
 * Provides methods for creating durations in different units (milliseconds, seconds, minutes, hours, days, weeks)
 * and converting between them with optional rounding.
 * 
 * @example
 * ```typescript
 * const duration = Duration.fromHours(2.5);
 * const minutes = duration.toMinutes(); // 150
 * const roundedMinutes = duration.toMinutes(true); // 150
 * ```
 */
export class Duration
{
    private readonly _ms: number;


    /**
     * Creates a new Duration instance.
     * 
     * @param ms - The duration in milliseconds.
     * @throws Error if ms is negative.
     * @private
     */
    private constructor(ms: number)
    {
        given(ms, "ms").ensureHasValue().ensureIsNumber().ensure(t => t >= 0);
        this._ms = ms;
    }


    /**
     * Creates a Duration from milliseconds.
     * 
     * @param milliSeconds - The duration in milliseconds.
     * @returns A new Duration instance.
     * @throws Error if milliSeconds is negative.
     */
    public static fromMilliSeconds(milliSeconds: number): Duration
    {
        return new Duration(milliSeconds);
    }

    /**
     * Creates a Duration from seconds.
     * 
     * @param seconds - The duration in seconds.
     * @returns A new Duration instance.
     * @throws Error if seconds is negative.
     */
    public static fromSeconds(seconds: number): Duration
    {
        given(seconds, "seconds").ensureHasValue().ensureIsNumber();

        return this.fromMilliSeconds(seconds * 1000);
    }

    /**
     * Creates a Duration from minutes.
     * 
     * @param minutes - The duration in minutes.
     * @returns A new Duration instance.
     * @throws Error if minutes is negative.
     */
    public static fromMinutes(minutes: number): Duration
    {
        given(minutes, "minutes").ensureHasValue().ensureIsNumber();

        return this.fromSeconds(minutes * 60);
    }

    /**
     * Creates a Duration from hours.
     * 
     * @param hours - The duration in hours.
     * @returns A new Duration instance.
     * @throws Error if hours is negative.
     */
    public static fromHours(hours: number): Duration
    {
        given(hours, "hours").ensureHasValue().ensureIsNumber();

        return this.fromMinutes(hours * 60);
    }

    /**
     * Creates a Duration from days.
     * 
     * @param days - The duration in days.
     * @returns A new Duration instance.
     * @throws Error if days is negative.
     */
    public static fromDays(days: number): Duration
    {
        given(days, "days").ensureHasValue().ensureIsNumber();

        return this.fromHours(days * 24);
    }

    /**
     * Creates a Duration from weeks.
     * 
     * @param weeks - The duration in weeks.
     * @returns A new Duration instance.
     * @throws Error if weeks is negative.
     */
    public static fromWeeks(weeks: number): Duration
    {
        given(weeks, "weeks").ensureHasValue().ensureIsNumber();

        return this.fromDays(weeks * 7);
    }

    /**
     * Converts the duration to milliseconds.
     * 
     * @param round - Whether to round the result to the nearest integer.
     * @returns The duration in milliseconds.
     */
    public toMilliSeconds(round = false): number
    {
        const result = this._ms;
        return round ? Math.round(result) : result;
    }

    /**
     * Converts the duration to seconds.
     * 
     * @param round - Whether to round the result to the nearest integer.
     * @returns The duration in seconds.
     */
    public toSeconds(round = false): number
    {
        const result = this.toMilliSeconds() / 1000;
        return round ? Math.round(result) : result;
    }

    /**
     * Converts the duration to minutes.
     * 
     * @param round - Whether to round the result to the nearest integer.
     * @returns The duration in minutes.
     */
    public toMinutes(round = false): number
    {
        const result = this.toSeconds() / 60;
        return round ? Math.round(result) : result;
    }

    /**
     * Converts the duration to hours.
     * 
     * @param round - Whether to round the result to the nearest integer.
     * @returns The duration in hours.
     */
    public toHours(round = false): number
    {
        const result = this.toMinutes() / 60;
        return round ? Math.round(result) : result;
    }

    /**
     * Converts the duration to days.
     * 
     * @param round - Whether to round the result to the nearest integer.
     * @returns The duration in days.
     */
    public toDays(round = false): number
    {
        const result = this.toHours() / 24;
        return round ? Math.round(result) : result;
    }

    /**
     * Converts the duration to weeks.
     * 
     * @param round - Whether to round the result to the nearest integer.
     * @returns The duration in weeks.
     */
    public toWeeks(round = false): number
    {
        const result = this.toDays() / 7;
        return round ? Math.round(result) : result;
    }
}