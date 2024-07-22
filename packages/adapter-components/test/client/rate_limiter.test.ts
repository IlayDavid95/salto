/*
 *                      Copyright 2024 Salto Labs Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { RATE_LIMIT_DEFAULT_DELAY_PER_REQUEST_MS } from '../../src/client'
import { RateLimiter, RateLimiterOptions } from '../../src/client/rate_limiter'

describe.each([true, false])('RateLimiter (useBottleneck: %s)', useBottleneck => {
  let DEFAULT_RATE_LIMITER: RateLimiter

  beforeEach(() => {
    DEFAULT_RATE_LIMITER = new RateLimiter({ useBottleneck })
    jest.resetAllMocks() // Reset all mocks after each test
    jest.restoreAllMocks()
  })

  describe('The constructor', () => {
    it('should handle partial options correctly', () => {
      const options: Partial<RateLimiterOptions> = {
        maxConcurrentCalls: 5,
        useBottleneck,
      }
      const rateLimiter = new RateLimiter(options)

      const expectedOptions: RateLimiterOptions = {
        ...DEFAULT_RATE_LIMITER.options,
        ...options,
      }

      expect(rateLimiter.options).toEqual(expectedOptions)
    })

    it('should handle partial options correctly with different set', () => {
      const options: Partial<RateLimiterOptions> = {
        maxCallsPerInterval: 10,
        intervalLengthMS: 1000,
        useBottleneck,
      }
      const rateLimiter = new RateLimiter(options)

      const expectedOptions: RateLimiterOptions = {
        ...DEFAULT_RATE_LIMITER.options,
        ...options,
      }

      expect(rateLimiter.options).toEqual(expectedOptions)
    })

    it.each([
      { maxConcurrentCalls: 1, expected: 1 },
      { maxConcurrentCalls: 0, expected: Infinity },
      { maxConcurrentCalls: -1, expected: Infinity },
      { maxConcurrentCalls: undefined, expected: Infinity },
    ])('should handle boundary values for maxConcurrentCalls', ({ maxConcurrentCalls, expected }) => {
      const rateLimiter = new RateLimiter({ maxConcurrentCalls, useBottleneck })
      expect(rateLimiter.options.maxConcurrentCalls).toBe(expected)
    })

    it.each([
      { delayMS: 1, expected: 1 },
      { delayMS: 0, expected: 0 },
      { delayMS: -1, expected: 0 },
      { delayMS: undefined, expected: RATE_LIMIT_DEFAULT_DELAY_PER_REQUEST_MS },
    ])('should handle boundary values for delayMS', ({ delayMS, expected }) => {
      const rateLimiter = new RateLimiter({ delayMS, useBottleneck })
      expect(rateLimiter.options.delayMS).toBe(expected)
    })

    it.each([
      { maxCallsPerInterval: 1, intervalLengthMS: 1000, expectedCalls: 1, expectedInterval: 1000 },
      { maxCallsPerInterval: Infinity, intervalLengthMS: -1, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: Infinity, intervalLengthMS: 0, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: Infinity, intervalLengthMS: undefined, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: -1, intervalLengthMS: -1, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: -1, intervalLengthMS: 0, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: -1, intervalLengthMS: undefined, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: 0, intervalLengthMS: -1, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: 0, intervalLengthMS: 0, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: 0, intervalLengthMS: undefined, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: undefined, intervalLengthMS: -1, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: undefined, intervalLengthMS: 0, expectedCalls: Infinity, expectedInterval: 0 },
      { maxCallsPerInterval: undefined, intervalLengthMS: undefined, expectedCalls: Infinity, expectedInterval: 0 },
    ])(
      'should handle boundary values for maxCallsPerInterval and intervalLengthMS',
      ({ maxCallsPerInterval, intervalLengthMS, expectedCalls, expectedInterval }) => {
        const rateLimiter = new RateLimiter({ maxCallsPerInterval, intervalLengthMS, useBottleneck })
        expect(rateLimiter.options.maxCallsPerInterval).toBe(expectedCalls)
        expect(rateLimiter.options.intervalLengthMS).toBe(expectedInterval)
      },
    )

    it.each([
      { maxCallsPerInterval: 10, intervalLengthMS: undefined },
      { maxCallsPerInterval: 10, intervalLengthMS: 0 },
      { maxCallsPerInterval: 10, intervalLengthMS: -1 },
      { maxCallsPerInterval: Infinity, intervalLengthMS: 1000 },
      { maxCallsPerInterval: undefined, intervalLengthMS: 1000 },
      { maxCallsPerInterval: 0, intervalLengthMS: 1000 },
      { maxCallsPerInterval: -1, intervalLengthMS: 1000 },
    ])(
      'should throw an error if maxCallsPerInterval and intervalLengthMS are not properly set',
      ({ maxCallsPerInterval, intervalLengthMS }) => {
        expect(() => new RateLimiter({ maxCallsPerInterval, intervalLengthMS, useBottleneck })).toThrow(
          'When setting either maxCallsPerInterval or intervalLengthMS to a valid finite number bigger than 0, the other must be set as well.',
        )
      },
    )

    it.each([Infinity, 0, -1, undefined])(
      'should handle maxCallsPerInterval set to Infinity explicitly or implicitly with intervalLengthMS not set',
      maxCallsPerInterval => {
        const rateLimiter = new RateLimiter({ maxCallsPerInterval, useBottleneck })

        const expectedOptions: RateLimiterOptions = {
          ...DEFAULT_RATE_LIMITER.options,
          maxCallsPerInterval: Infinity,
        }

        expect(rateLimiter.options).toEqual(expectedOptions)
      },
    )
    it.each([0, -1, undefined])(
      'should handle intervalLengthMS set to 0 explicitly or implicitly with maxCallsPerInterval not set',
      intervalLengthMS => {
        const rateLimiter = new RateLimiter({ intervalLengthMS, useBottleneck })
        const expectedOptions: RateLimiterOptions = {
          ...DEFAULT_RATE_LIMITER.options,
          intervalLengthMS: 0,
        }
        expect(rateLimiter.options).toEqual(expectedOptions)
      },
    )
    it('should throw an error when startPaused and useBottleneck are set to true', () => {
      if (useBottleneck) {
        expect(() => new RateLimiter({ startPaused: true, useBottleneck })).toThrow(
          "Bottleneck queue can't be paused and thus can't be initialized with startPaused==true or pauseDuringDelay==true.",
        )
      } else {
        const rateLimiter = new RateLimiter({ startPaused: true, useBottleneck })
        const expectedOptions: RateLimiterOptions = {
          ...DEFAULT_RATE_LIMITER.options,
          startPaused: true,
        }
        expect(rateLimiter.options).toEqual(expectedOptions)
      }
    })
  })

  describe('Wrapping methods', () => {
    it('should wrap a single async function and throttle it', async () => {
      const rateLimiter = new RateLimiter({ useBottleneck })

      const asyncTask = jest.fn(async (taskId: number) => taskId)

      const wrappedTask = rateLimiter.wrap(asyncTask)

      const result = await wrappedTask(1)
      expect(result).toBe(1)
      expect(asyncTask).toHaveBeenCalledWith(1)
    })

    it('should wrap multiple async functions and throttle them', async () => {
      const rateLimiter = new RateLimiter({ useBottleneck })

      const asyncTask1 = jest.fn(async (taskId: number) => `Task1 ${taskId}`)

      const asyncTask2 = jest.fn(async (taskId: number) => `Task2 ${taskId}`)

      const [wrappedTask1, wrappedTask2] = rateLimiter.wrapAll([asyncTask1, asyncTask2])

      const result1 = await wrappedTask1(1)
      const result2 = await wrappedTask2(2)

      expect(result1).toBe('Task1 1')
      expect(result2).toBe('Task2 2')
      expect(asyncTask1).toHaveBeenCalledWith(1)
      expect(asyncTask2).toHaveBeenCalledWith(2)
    })

    it('should add a single async function to the queue and execute it', async () => {
      const rateLimiter = new RateLimiter({ useBottleneck })

      const asyncTask = jest.fn(async (taskId: number) => taskId)

      const result = await rateLimiter.add(() => asyncTask(1))
      expect(result).toBe(1)
      expect(asyncTask).toHaveBeenCalledWith(1)
    })

    it('should add multiple tasks to the queue and execute them', async () => {
      const rateLimiter = new RateLimiter({ useBottleneck })

      const asyncTask = jest.fn(async (taskId: number) => taskId)

      const tasks = [() => asyncTask(1), () => asyncTask(2), () => asyncTask(3)]

      const results = await Promise.all(rateLimiter.addAll(tasks))

      expect(results).toEqual([1, 2, 3])
      expect(asyncTask).toHaveBeenCalledWith(1)
      expect(asyncTask).toHaveBeenCalledWith(2)
      expect(asyncTask).toHaveBeenCalledWith(3)
    })
    it('should properly calculate the next delay for a task.', () => {
      let timeElapsed = 0
      jest.spyOn(Date, 'now').mockReturnValue(timeElapsed) // Mock current time
      const delayMS = 500
      const rateLimiter = new RateLimiter({ delayMS })
      // @ts-expect-error accessing private member/function
      expect(rateLimiter.nextDelay()).toBe(delayMS)
      // @ts-expect-error accessing private member/function
      expect(rateLimiter.nextDelay()).toBe(delayMS * 2)

      // Partial delay
      timeElapsed = 100
      jest.spyOn(Date, 'now').mockReturnValue(timeElapsed)
      // @ts-expect-error accessing private member/function
      expect(rateLimiter.nextDelay()).toBe(delayMS * 3 - timeElapsed)

      // No delay needed
      // @ts-expect-error accessing private member/function
      timeElapsed = rateLimiter.prevInvocationTime + delayMS
      jest.spyOn(Date, 'now').mockReturnValue(timeElapsed)
      // @ts-expect-error accessing private member/function
      expect(rateLimiter.nextDelay()).toBe(0)
    })
    it('should properly wrap task with delay.', async () => {
      const delayMS = 500
      const rateLimiter = new RateLimiter({ delayMS })

      const timer = {
        // @ts-expect-error accessing private member/function
        startTime: rateLimiter.prevInvocationTime,
        timeElapsed: 0,
      }
      // @ts-expect-error accessing private member/function
      const delayedTask = rateLimiter.getDelayedTask(() => {
        timer.timeElapsed = Date.now() - timer.startTime
      })
      await delayedTask()
      const { timeElapsed, startTime } = timer

      const toleranceMS = 5 // required tolerance for delays

      // @ts-expect-error accessing private member/function
      expect(rateLimiter.prevInvocationTime).toBeGreaterThanOrEqual(startTime + delayMS - toleranceMS)
      // @ts-expect-error accessing private member/function
      expect(rateLimiter.prevInvocationTime).toBeLessThan(startTime + delayMS * 2 + toleranceMS)

      expect(timeElapsed).toBeGreaterThanOrEqual(delayMS - toleranceMS)
      expect(timeElapsed).toBeLessThan(delayMS * 2 + toleranceMS)
    })
  })
  describe('Configuring retry', () => {
    it('should not retry if not configured.', async () => {
      const errorMessage = 'Some error'
      const throwingTask = jest.fn(() => {
        throw new Error(errorMessage)
      })
      await expect(DEFAULT_RATE_LIMITER.add(throwingTask)).rejects.toThrow(errorMessage)
      expect(DEFAULT_RATE_LIMITER.counters.retries).toEqual(0)
      expect(DEFAULT_RATE_LIMITER.counters.failed).toEqual(1)
    })
    it('should retry if configured.', async () => {
      const errorMessage = 'Some error'
      const maxAttempts = 3
      const throwingTask = jest.fn(async () => {
        throw new Error(errorMessage)
      })
      const retryPredicate = jest.fn(
        (numAttempts: number, error: Error): boolean =>
          error instanceof Error && error.message === errorMessage && numAttempts < maxAttempts,
      )
      const rateLimiter = new RateLimiter({ retryPredicate, useBottleneck })

      await expect(rateLimiter.add(throwingTask)).rejects.toThrow(errorMessage)
      expect(throwingTask).toHaveBeenCalledTimes(maxAttempts)
      expect(retryPredicate).toHaveBeenCalledTimes(maxAttempts)
      expect(rateLimiter.counters.retries).toEqual(maxAttempts - 1)
      expect(rateLimiter.counters.failed).toEqual(maxAttempts)
      expect(rateLimiter.counters.total).toEqual(maxAttempts)
      expect(rateLimiter.counters.done).toEqual(maxAttempts)
    })
    it('should delay between retries.', async () => {
      const toleranceMS = 5
      const errorMessage = 'Some error'
      const retryDelayMS = 50
      const maxAttempts = 3
      const throwingTask = jest.fn(async () => {
        throw new Error(errorMessage)
      })
      const retryPredicate = jest.fn(
        (numAttempts: number, error: Error): boolean =>
          error instanceof Error && error.message === errorMessage && numAttempts < maxAttempts,
      )
      const calculateRetryDelayMS = jest.fn((numAttempts: number, error: Error): number =>
        error instanceof Error && error.message === errorMessage ? numAttempts * retryDelayMS : 0,
      )
      const startTime = Date.now()
      const rateLimiter = new RateLimiter({ retryPredicate, calculateRetryDelayMS, useBottleneck: true })

      await expect(rateLimiter.add(throwingTask)).rejects.toThrow(errorMessage)
      const timeElapsed = Date.now() - startTime

      expect(throwingTask).toHaveBeenCalledTimes(maxAttempts)
      expect(retryPredicate).toHaveBeenCalledTimes(maxAttempts)
      expect(calculateRetryDelayMS).toHaveBeenCalledTimes(maxAttempts - 1)

      let expectedTimeElapsed = 0
      for (let index = 1; index < maxAttempts; index += 1) {
        expectedTimeElapsed += index * retryDelayMS
      }
      expect(timeElapsed).toBeGreaterThanOrEqual(expectedTimeElapsed - toleranceMS)
      expect(timeElapsed).toBeLessThanOrEqual(expectedTimeElapsed * 2 + toleranceMS)
      expect(rateLimiter.counters.retries).toEqual(maxAttempts - 1)
      expect(rateLimiter.counters.failed).toEqual(maxAttempts)
      expect(rateLimiter.counters.total).toEqual(maxAttempts)
      expect(rateLimiter.counters.done).toEqual(maxAttempts)
    })
  })
})
