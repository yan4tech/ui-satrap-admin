'use client';

import { ServiceEntitlementGuard } from 'src/components/service-entitlement-guard';

import { ServiceWorkflowPage } from '../one/page';

import { startService } from './start-service-api';
import ServiceFourTaskPanel from './ServiceFourTaskPanel';
import {
  SERVICE4_STEPPER_LABELS,
  getService4BpmnElementIdForStepperIndex,
  getService4StepperIndexForElementId,
  getService4WorkflowRank,
} from './service4-step-config';

const SERVICE4_DEFINITION_KEY = 'service4';

export default function WorkflowWizard() {
  return (
    <ServiceEntitlementGuard processKey={SERVICE4_DEFINITION_KEY}>
      <ServiceWorkflowPage
        serviceDefinitionKey={SERVICE4_DEFINITION_KEY}
        serviceTitle="صدور سند مطابق قانون تعیین تکلیف وضعیت اراضی و ساختمان‌های فاقد سند رسمی"
        startServiceFn={startService}
        TaskPanelComponent={ServiceFourTaskPanel}
        stepperLabels={SERVICE4_STEPPER_LABELS}
        getStepperIndexForElementId={getService4StepperIndexForElementId}
        getBpmnElementIdForStepperIndex={getService4BpmnElementIdForStepperIndex}
        getWorkflowRank={getService4WorkflowRank}
      />
    </ServiceEntitlementGuard>
  );
}
