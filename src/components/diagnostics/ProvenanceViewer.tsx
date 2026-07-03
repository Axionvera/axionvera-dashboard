import React from 'react';
import { TrackedValue, TransformationStep } from '@/types/provenance';

type Props = {
  trackedValue: any | TrackedValue<any>;
};

export function ProvenanceViewer({ trackedValue }: Props) {
  // Only render if it's a valid tracked value
  if (!trackedValue || typeof trackedValue !== 'object' || !('__provenance' in trackedValue)) {
    return null;
  }

  const { source, createdAt, lineage } = trackedValue.__provenance;
  
  return (
    <div className="mt-3 p-3 border border-border-primary rounded-xl bg-background-secondary/50 text-xs text-text-secondary overflow-auto font-mono">
      <div className="font-semibold text-text-primary mb-2 text-[10px] uppercase tracking-wider">
        Data Provenance Trace
      </div>
      <div className="mb-3 leading-relaxed">
        <span className="text-text-muted">Source:</span> <span className="text-emerald-400 font-medium">{source}</span>
        <br/>
        <span className="text-text-muted">Created:</span> {new Date(createdAt).toISOString()}
      </div>
      
      {lineage.length > 0 && (
        <div>
          <div className="text-text-muted mb-2 text-[10px] uppercase tracking-wider">Lineage</div>
          <div className="pl-3 border-l border-border-primary space-y-3">
            {lineage.map((step: TransformationStep, i: number) => (
              <div key={i} className="relative">
                <div className="absolute -left-3 top-2 w-2 border-t border-border-primary" />
                <div className="text-blue-400 font-medium">
                  {step.actor} <span className="text-text-muted mx-1">→</span> {step.operation}
                </div>
                <div className="text-[10px] text-text-tertiary mt-0.5">
                  {new Date(step.timestamp).toISOString()}
                </div>
                {step.previousValue !== undefined && (
                  <div className="mt-1 truncate opacity-75 text-text-muted">
                    prev: {String(step.previousValue)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
