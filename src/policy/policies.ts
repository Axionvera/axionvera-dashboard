import type {
  Policy,
  PolicyContext,
  PolicyEvaluationResponse,
  PolicyViolation
} from './types';
import { PolicyEvaluationResult } from './types';

export abstract class BasePolicy implements Policy {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  enabled: boolean;

  constructor(params: {
    id: string;
    name: string;
    description?: string;
    version: string;
    enabled?: boolean;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.version = params.version;
    this.enabled = params.enabled ?? true;
  }

  abstract evaluate(context: PolicyContext): Promise<PolicyEvaluationResponse>;
}

export class AllowAllPolicy extends BasePolicy {
  constructor() {
    super({
      id: 'allow-all',
      name: 'Allow All',
      description: 'Allows all operations',
      version: '1.0.0'
    });
  }

  async evaluate(context: PolicyContext): Promise<PolicyEvaluationResponse> {
    return {
      result: PolicyEvaluationResult.ALLOW,
      violations: [],
      evaluatedAt: Date.now(),
      policyCount: 1
    };
  }
}

export class DenyAllPolicy extends BasePolicy {
  constructor() {
    super({
      id: 'deny-all',
      name: 'Deny All',
      description: 'Denies all operations',
      version: '1.0.0'
    });
  }

  async evaluate(context: PolicyContext): Promise<PolicyEvaluationResponse> {
    const violation: PolicyViolation = {
      policyId: this.id,
      message: 'All operations are denied by this policy',
      severity: 'error'
    };

    return {
      result: PolicyEvaluationResult.DENY,
      violations: [violation],
      evaluatedAt: Date.now(),
      policyCount: 1
    };
  }
}

export class OperationWhitelistPolicy extends BasePolicy {
  private allowedOperations: Set<string>;

  constructor(params: {
    id: string;
    name: string;
    description?: string;
    allowedOperations: string[];
    enabled?: boolean;
  }) {
    super({
      id: params.id,
      name: params.name,
      description: params.description,
      version: '1.0.0',
      enabled: params.enabled
    });
    this.allowedOperations = new Set(params.allowedOperations);
  }

  async evaluate(context: PolicyContext): Promise<PolicyEvaluationResponse> {
    if (!this.enabled) {
      return {
        result: PolicyEvaluationResult.ALLOW,
        violations: [],
        evaluatedAt: Date.now(),
        policyCount: 1
      };
    }

    if (this.allowedOperations.has(context.operation)) {
      return {
        result: PolicyEvaluationResult.ALLOW,
        violations: [],
        evaluatedAt: Date.now(),
        policyCount: 1
      };
    }

    const violation: PolicyViolation = {
      policyId: this.id,
      message: `Operation "${context.operation}" is not in the whitelist`,
      severity: 'error'
    };

    return {
      result: PolicyEvaluationResult.DENY,
      violations: [violation],
      evaluatedAt: Date.now(),
      policyCount: 1
    };
  }
}

export class ActorRestrictionPolicy extends BasePolicy {
  private allowedActors: Set<string>;

  constructor(params: {
    id: string;
    name: string;
    description?: string;
    allowedActors: string[];
    enabled?: boolean;
  }) {
    super({
      id: params.id,
      name: params.name,
      description: params.description,
      version: '1.0.0',
      enabled: params.enabled
    });
    this.allowedActors = new Set(params.allowedActors);
  }

  async evaluate(context: PolicyContext): Promise<PolicyEvaluationResponse> {
    if (!this.enabled) {
      return {
        result: PolicyEvaluationResult.ALLOW,
        violations: [],
        evaluatedAt: Date.now(),
        policyCount: 1
      };
    }

    if (this.allowedActors.has(context.actor)) {
      return {
        result: PolicyEvaluationResult.ALLOW,
        violations: [],
        evaluatedAt: Date.now(),
        policyCount: 1
      };
    }

    const violation: PolicyViolation = {
      policyId: this.id,
      message: `Actor "${context.actor}" is not allowed to perform this operation`,
      severity: 'error'
    };

    return {
      result: PolicyEvaluationResult.DENY,
      violations: [violation],
      evaluatedAt: Date.now(),
      policyCount: 1
    };
  }
}

export class TimeWindowPolicy extends BasePolicy {
  private startHour: number;
  private endHour: number;

  constructor(params: {
    id: string;
    name: string;
    description?: string;
    startHour: number;
    endHour: number;
    enabled?: boolean;
  }) {
    super({
      id: params.id,
      name: params.name,
      description: params.description,
      version: '1.0.0',
      enabled: params.enabled
    });
    this.startHour = params.startHour;
    this.endHour = params.endHour;
  }

  async evaluate(context: PolicyContext): Promise<PolicyEvaluationResponse> {
    if (!this.enabled) {
      return {
        result: PolicyEvaluationResult.ALLOW,
        violations: [],
        evaluatedAt: Date.now(),
        policyCount: 1
      };
    }

    const currentHour = new Date(context.timestamp).getHours();
    if (currentHour >= this.startHour && currentHour < this.endHour) {
      return {
        result: PolicyEvaluationResult.ALLOW,
        violations: [],
        evaluatedAt: Date.now(),
        policyCount: 1
      };
    }

    const violation: PolicyViolation = {
      policyId: this.id,
      message: `Operation not allowed outside of ${this.startHour}:00 - ${this.endHour}:00`,
      severity: 'error'
    };

    return {
      result: PolicyEvaluationResult.DENY,
      violations: [violation],
      evaluatedAt: Date.now(),
      policyCount: 1
    };
  }
}
