/**
 * Recovery workflows for different failure scenarios
 */

import { AppError, ErrorCategory, toAppError } from '@/errors';
import { sleep } from '@/errors/recovery';

/**
 * Workflow state
 */
export enum WorkflowState {
  IDLE = 'idle',
  RUNNING = 'running',
  RECOVERING = 'recovering',
  PAUSED = 'paused',
  SUCCESS = 'success',
  FAILED = 'failed'
}

/**
 * Recovery action type
 */
export enum RecoveryActionType {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  CLEAR_CACHE = 'clear_cache',
  REFRESH_DATA = 'refresh_data',
  NOTIFY_USER = 'notify_user',
  ESCALATE = 'escalate'
}

/**
 * Recovery action
 */
export interface RecoveryAction {
  type: RecoveryActionType;
  execute: () => Promise<void>;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

/**
 * Recovery step
 */
export interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  condition: (error: AppError) => boolean;
  actions: RecoveryAction[];
  timeout?: number;
  maxAttempts?: number;
}

/**
 * Recovery workflow
 */
export interface RecoveryWorkflow {
  id: string;
  name: string;
  description: string;
  errorCategories: ErrorCategory[];
  steps: RecoveryStep[];
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  workflowId: string;
  state: WorkflowState;
  success: boolean;
  completedSteps: string[];
  failedAtStep?: string;
  error?: AppError;
  executionTimeMs: number;
}

/**
 * Standard recovery workflows
 */
export const RECOVERY_WORKFLOWS: Record<string, RecoveryWorkflow> = {
  // Network recovery workflow
  networkRecovery: {
    id: 'network-recovery',
    name: 'Network Error Recovery',
    description: 'Recovers from temporary network connectivity issues',
    errorCategories: [ErrorCategory.NETWORK],
    steps: [
      {
        id: 'wait-and-retry',
        name: 'Wait and Retry',
        description: 'Wait a moment and retry the operation',
        condition: (error) => error.category === ErrorCategory.NETWORK,
        actions: [
          {
            type: RecoveryActionType.RETRY,
            execute: async () => {
              await sleep(2000);
            }
          }
        ],
        timeout: 10000,
        maxAttempts: 3
      },
      {
        id: 'check-connectivity',
        name: 'Check Connectivity',
        description: 'Verify internet connection is restored',
        condition: (error) => error.category === ErrorCategory.NETWORK,
        actions: [
          {
            type: RecoveryActionType.REFRESH_DATA,
            execute: async () => {
              // Try a simple connectivity check
              try {
                const response = await fetch('https://www.google.com', {
                  method: 'HEAD',
                  mode: 'no-cors'
                });
              } catch (error) {
                throw new Error('No internet connection')
              }
            }
          }
        ],
        timeout: 5000
      }
    ]
  },

  // Timeout recovery workflow
  timeoutRecovery: {
    id: 'timeout-recovery',
    name: 'Timeout Recovery',
    description: 'Recovers from request timeouts',
    errorCategories: [ErrorCategory.TIMEOUT],
    steps: [
      {
        id: 'increase-timeout',
        name: 'Increase Timeout',
        description: 'Retry with longer timeout',
        condition: (error) => error.category === ErrorCategory.TIMEOUT,
        actions: [
          {
            type: RecoveryActionType.RETRY,
            execute: async () => {
              await sleep(1000);
            }
          }
        ],
        timeout: 20000,
        maxAttempts: 2
      },
      {
        id: 'notify-user',
        name: 'Notify User',
        description: 'Inform user of slow network',
        condition: (error) => error.category === ErrorCategory.TIMEOUT,
        actions: [
          {
            type: RecoveryActionType.NOTIFY_USER,
            execute: async () => {
              console.log('Network is slow, retrying with longer timeout...');
            }
          }
        ]
      }
    ]
  },

  // Server error recovery workflow
  serverRecovery: {
    id: 'server-recovery',
    name: 'Server Error Recovery',
    description: 'Recovers from temporary server errors',
    errorCategories: [ErrorCategory.SERVER, ErrorCategory.SERVICE_UNAVAILABLE],
    steps: [
      {
        id: 'exponential-backoff',
        name: 'Exponential Backoff Retry',
        description: 'Retry with exponential backoff',
        condition: (error) =>
          error.category === ErrorCategory.SERVER ||
          error.category === ErrorCategory.SERVICE_UNAVAILABLE,
        actions: [
          {
            type: RecoveryActionType.RETRY,
            execute: async () => {
              await sleep(5000);
            }
          }
        ],
        timeout: 15000,
        maxAttempts: 3
      },
      {
        id: 'clear-cache-and-retry',
        name: 'Clear Cache and Retry',
        description: 'Clear cached data and retry',
        condition: (error) => error.category === ErrorCategory.SERVER,
        actions: [
          {
            type: RecoveryActionType.CLEAR_CACHE,
            execute: async () => {
              // Clear relevant caches
              if (typeof localStorage !== 'undefined') {
                const keysToRemove = Object.keys(localStorage).filter(key =>
                  key.includes('cache') || key.includes('axionvera')
                );
                keysToRemove.forEach(key => localStorage.removeItem(key));
              }
            }
          },
          {
            type: RecoveryActionType.REFRESH_DATA,
            execute: async () => {
              console.log('Cache cleared, retrying...');
            }
          }
        ]
      }
    ]
  },

  // Contract error recovery workflow
  contractRecovery: {
    id: 'contract-recovery',
    name: 'Contract Error Recovery',
    description: 'Recovers from contract-related errors',
    errorCategories: [ErrorCategory.CONTRACT, ErrorCategory.BLOCKCHAIN],
    steps: [
      {
        id: 'validate-input',
        name: 'Validate Input',
        description: 'Verify transaction input parameters',
        condition: (error) => error.category === ErrorCategory.CONTRACT,
        actions: [
          {
            type: RecoveryActionType.NOTIFY_USER,
            execute: async () => {
              console.log('Validating transaction input...');
            }
          }
        ]
      },
      {
        id: 'check-balance',
        name: 'Check Balance',
        description: 'Verify sufficient balance',
        condition: (error) =>
          error.category === ErrorCategory.CONTRACT &&
          error.message.includes('balance'),
        actions: [
          {
            type: RecoveryActionType.REFRESH_DATA,
            execute: async () => {
              console.log('Refreshing balance information...');
            }
          }
        ],
        timeout: 5000
      },
      {
        id: 'retry-transaction',
        name: 'Retry Transaction',
        description: 'Retry the failed transaction',
        condition: (error) => error.category === ErrorCategory.CONTRACT,
        actions: [
          {
            type: RecoveryActionType.RETRY,
            execute: async () => {
              await sleep(1000);
            }
          }
        ],
        timeout: 30000,
        maxAttempts: 2
      }
    ]
  }
};

/**
 * Workflow executor
 */
export class WorkflowExecutor {
  private currentState: WorkflowState = WorkflowState.IDLE;
  private completedSteps: Set<string> = new Set();
  private startTime: number = 0;

  /**
   * Execute recovery workflow
   */
  async executeWorkflow(
    workflow: RecoveryWorkflow,
    error: AppError
  ): Promise<WorkflowExecutionResult> {
    this.startTime = Date.now();
    this.currentState = WorkflowState.RUNNING;
    this.completedSteps.clear();

    try {
      for (const step of workflow.steps) {
        // Check if step applies to this error
        if (!step.condition(error)) {
          console.log(`[Workflow ${workflow.id}] Skipping step "${step.name}" (condition not met)`);
          continue;
        }

        this.currentState = WorkflowState.RECOVERING;
        console.log(`[Workflow ${workflow.id}] Executing step: ${step.name}`);

        try {
          // Execute all actions in step
          for (const action of step.actions) {
            const actionPromise = action.execute();
            
            // Apply timeout if specified
            if (step.timeout) {
              await Promise.race([
                actionPromise,
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error(`Action timed out after ${step.timeout}ms`)),
                    step.timeout
                  )
                )
              ]);
            } else {
              await actionPromise;
            }

            // Call success handler if provided
            if (action.onSuccess) {
              action.onSuccess();
            }
          }

          this.completedSteps.add(step.id);
          console.log(`[Workflow ${workflow.id}] Step "${step.name}" completed successfully`);
        } catch (stepError) {
          console.error(`[Workflow ${workflow.id}] Step "${step.name}" failed:`, stepError);

          // Call failure handler if provided
          const failedAction = step.actions[0];
          if (failedAction?.onFailure) {
            failedAction.onFailure(stepError as Error);
          }

          // Continue to next step on failure (non-blocking)
          continue;
        }
      }

      this.currentState = WorkflowState.SUCCESS;

      return {
        workflowId: workflow.id,
        state: WorkflowState.SUCCESS,
        success: true,
        completedSteps: Array.from(this.completedSteps),
        executionTimeMs: Date.now() - this.startTime
      };
    } catch (error) {
      this.currentState = WorkflowState.FAILED;

      return {
        workflowId: workflow.id,
        state: WorkflowState.FAILED,
        success: false,
        completedSteps: Array.from(this.completedSteps),
        error: error instanceof AppError ? error : toAppError(error),
        executionTimeMs: Date.now() - this.startTime
      };
    }
  }
}

/**
 * Get recovery workflow for error
 */
export function getRecoveryWorkflow(error: AppError): RecoveryWorkflow | null {
  for (const workflow of Object.values(RECOVERY_WORKFLOWS)) {
    if (workflow.errorCategories.includes(error.category)) {
      return workflow;
    }
  }
  return null;
}

/**
 * Execute appropriate recovery workflow for error
 */
export async function executeRecoveryWorkflow(error: AppError): Promise<WorkflowExecutionResult | null> {
  const workflow = getRecoveryWorkflow(error);
  if (!workflow) {
    console.log(`No recovery workflow found for error category: ${error.category}`);
    return null;
  }

  const executor = new WorkflowExecutor();
  return executor.executeWorkflow(workflow, error);
}
