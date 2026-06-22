'use client';

import { ServiceEntitlementGuard } from 'src/components/service-entitlement-guard';

import { SERVICE_LABELS } from 'src/lib/service-labels';

import { ServiceWorkflowPage } from '../one/page';

import { startService } from './start-service-api';
import ServiceTwoTaskPanel from './ServiceTwoTaskPanel';
import {
  SERVICE2_STEPPER_LABELS,
  getService2BpmnElementIdForStepperIndex,
  getService2StepperIndexForElementId,
  getService2WorkflowRank,
} from './service2-step-config';

const SERVICE2_DEFINITION_KEY = 'service2';

export default function WorkflowWizard() {
  return (
    <ServiceEntitlementGuard processKey={SERVICE2_DEFINITION_KEY}>
    <ServiceWorkflowPage
      serviceDefinitionKey={SERVICE2_DEFINITION_KEY}
      serviceTitle={SERVICE_LABELS.service2}
      startServiceFn={startService}
      TaskPanelComponent={ServiceTwoTaskPanel}
      stepperLabels={SERVICE2_STEPPER_LABELS}
      getStepperIndexForElementId={getService2StepperIndexForElementId}
      getBpmnElementIdForStepperIndex={getService2BpmnElementIdForStepperIndex}
      getWorkflowRank={getService2WorkflowRank}
    />
    </ServiceEntitlementGuard>
  );
}
