'use client';

import { ServiceWorkflowPage } from '../one/page';

import { startService } from './start-service-api';
import ServiceThreeTaskPanel from './ServiceThreeTaskPanel';
import {
  SERVICE3_STEPPER_LABELS,
  getService3BpmnElementIdForStepperIndex,
  getService3StepperIndexForElementId,
  getService3WorkflowRank,
} from './service3-step-config';

const SERVICE3_DEFINITION_KEY = 'service3';

export default function WorkflowWizard() {
  return (
    <ServiceWorkflowPage
      serviceDefinitionKey={SERVICE3_DEFINITION_KEY}
      serviceTitle="خدمت شماره سه"
      startServiceFn={startService}
      TaskPanelComponent={ServiceThreeTaskPanel}
      stepperLabels={SERVICE3_STEPPER_LABELS}
      getStepperIndexForElementId={getService3StepperIndexForElementId}
      getBpmnElementIdForStepperIndex={getService3BpmnElementIdForStepperIndex}
      getWorkflowRank={getService3WorkflowRank}
    />
  );
}
