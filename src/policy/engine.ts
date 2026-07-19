import { PolicyEvaluationResult } from './types';
import type {
  Policy,
  PolicyContext,
  PolicyEvaluationResponse,
  PolicyEvent,
  PolicyEventHandler,
  PolicyViolation
} from './types';
import { PolicyEvaluationResult } from './types';

export class PolicyEngine {
  private policies: Map<string, Policy> = new Map();
  private eventHandlers: Set<PolicyEventHandler> = new Set();

  addPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy);
    this.emitEvent({
      type: 'policy.added',
      timestamp: Date.now(),
      data: { policyId: policy.id }
    });
  }

  removePolicy(policyId: string): boolean {
    const existed = this.policies.delete(policyId);
    if (existed) {
      this.emitEvent({
        type: 'policy.removed',
        timestamp: Date.now(),
        data: { policyId }
      });
    }
    return existed;
  }

  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  getAllPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  async evaluate(context: PolicyContext): Promise<PolicyEvaluationResponse> {
    const enabledPolicies = this.getAllPolicies().filter(p => p.enabled);
    const allViolations: PolicyViolation[] = [];
    let finalResult: PolicyEvaluationResult = PolicyEvaluationResult.ALLOW;

    for (const policy of enabledPolicies) {
      const response = await policy.evaluate(context);
      
      allViolations.push(...response.violations);
      
      if (response.result === PolicyEvaluationResult.DENY) {
        finalResult = PolicyEvaluationResult.DENY;
      } else if (response.result === PolicyEvaluationResult.WARN && finalResult === PolicyEvaluationResult.ALLOW) {
        finalResult = PolicyEvaluationResult.WARN;
      }
    }

    const evaluationResponse: PolicyEvaluationResponse = {
      result: finalResult,
      violations: allViolations,
      evaluatedAt: Date.now(),
      policyCount: enabledPolicies.length
    };

    this.emitEvent({
      type: 'policy.evaluated',
      timestamp: Date.now(),
      data: {
        context,
        response: evaluationResponse
      }
    });

    return evaluationResponse;
  }

  subscribe(handler: PolicyEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  private emitEvent(event: PolicyEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        void handler(event);
      } catch (error) {
        console.error('Policy event handler error:', error);
      }
    }
  }
}
