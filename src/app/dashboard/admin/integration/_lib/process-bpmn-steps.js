import { getProcessDefinition } from 'src/lib/integration-api';

/** @typedef {{ id: string, name: string, type: string }} BpmnStep */

/** @type {Record<string, { name: string, startId: string, elements: Record<string, { id: string, name: string, type: string }>, flows: { from: string, to: string }[] }>} */
export const PROCESS_BPMN_MODELS = {
  service1: {
    name: 'خدمت شماره یک (khedmat1)',
    startId: 'start',
    elements: {
      start: { id: 'start', name: 'Start', type: 'USER_TASK' },
      generate: { id: 'generate', name: 'Generate ID & Calculate Fee', type: 'SERVICE_TASK' },
      payment: { id: 'payment', name: 'Receive Payment', type: 'USER_TASK' },
      form1: { id: 'form1', name: 'Fill Form 1', type: 'USER_TASK' },
      review1: { id: 'review1', name: 'Central Review Form 1', type: 'SERVICE_REVIEW' },
      sendAgency1: { id: 'sendAgency1', name: 'Send To Agency', type: 'SERVICE_TASK' },
      enterCode: { id: 'enterCode', name: 'Enter SMS Code', type: 'USER_TASK' },
      payment1: { id: 'payment1', name: 'Receive Payment1', type: 'USER_TASK' },
      form2: { id: 'form2', name: 'Fill Form 2', type: 'USER_TASK' },
      review2: { id: 'review2', name: 'Central Review Form 2', type: 'SERVICE_REVIEW' },
      sendAgency2: { id: 'sendAgency2', name: 'Final Send To Agency', type: 'SERVICE_TASK' },
      end: { id: 'end', name: 'End', type: 'END_EVENT' },
    },
    flows: [
      { from: 'start', to: 'generate' },
      { from: 'generate', to: 'payment' },
      { from: 'payment', to: 'form1' },
      { from: 'form1', to: 'review1' },
      { from: 'review1', to: 'sendAgency1' },
      { from: 'sendAgency1', to: 'enterCode' },
      { from: 'enterCode', to: 'payment1' },
      { from: 'payment1', to: 'form2' },
      { from: 'form2', to: 'review2' },
      { from: 'review2', to: 'sendAgency2' },
      { from: 'sendAgency2', to: 'end' },
    ],
  },
  service2: {
    name: 'خدمت شماره دو (khedmat2)',
    startId: 'start',
    elements: {
      start: { id: 'start', name: 'Start', type: 'USER_TASK' },
      generate: { id: 'generate', name: 'Generate ID & Calculate Fee', type: 'SERVICE_TASK' },
      payment: { id: 'payment', name: 'Receive Payment', type: 'USER_TASK' },
      form1: { id: 'form1', name: 'Fill Form 1', type: 'USER_TASK' },
      review1: { id: 'review1', name: 'Central Review Form 1', type: 'SERVICE_REVIEW' },
      sendAgency: { id: 'sendAgency', name: 'Send To Agency', type: 'SERVICE_TASK' },
      tracking: { id: 'tracking', name: 'Show Registry Response', type: 'USER_TASK' },
      form2: { id: 'form2', name: 'Fill Form 2', type: 'USER_TASK' },
      review2: { id: 'review2', name: 'Central Review Form 2', type: 'SERVICE_REVIEW' },
      end: { id: 'end', name: 'End', type: 'END_EVENT' },
    },
    flows: [
      { from: 'start', to: 'generate' },
      { from: 'generate', to: 'payment' },
      { from: 'payment', to: 'form1' },
      { from: 'form1', to: 'review1' },
      { from: 'review1', to: 'sendAgency' },
      { from: 'sendAgency', to: 'tracking' },
      { from: 'tracking', to: 'form2' },
      { from: 'form2', to: 'review2' },
      { from: 'review2', to: 'end' },
    ],
  },
  service3: {
    name: 'خدمت شماره سه (khedmat3)',
    startId: 'start',
    elements: {
      start: { id: 'start', name: 'Start', type: 'USER_TASK' },
      payment: { id: 'payment', name: 'Receive Payment', type: 'USER_TASK' },
      form1: { id: 'form1', name: 'Fill Form 1', type: 'USER_TASK' },
      review1: { id: 'review1', name: 'Central Review Form 1', type: 'SERVICE_REVIEW' },
      sendAgency: { id: 'sendAgency', name: 'Send To Agency', type: 'SERVICE_TASK' },
      tracking: { id: 'tracking', name: 'Show Registry Response', type: 'USER_TASK' },
      form2: { id: 'form2', name: 'Fill Form 2', type: 'USER_TASK' },
      review2: { id: 'review2', name: 'Central Review Form 2', type: 'SERVICE_REVIEW' },
      end: { id: 'end', name: 'End', type: 'END_EVENT' },
    },
    flows: [
      { from: 'start', to: 'payment' },
      { from: 'payment', to: 'form1' },
      { from: 'form1', to: 'review1' },
      { from: 'review1', to: 'sendAgency' },
      { from: 'sendAgency', to: 'tracking' },
      { from: 'tracking', to: 'form2' },
      { from: 'form2', to: 'review2' },
      { from: 'review2', to: 'end' },
    ],
  },
  service4: {
    name: 'خدمت شماره چهار (khedmat4)',
    startId: 'start',
    elements: {
      start: { id: 'start', name: 'Start', type: 'USER_TASK' },
      generate: { id: 'generate', name: 'Generate ID & Calculate Fee', type: 'SERVICE_TASK' },
      payment: { id: 'payment', name: 'Receive Payment', type: 'USER_TASK' },
      stage1_initial: { id: 'stage1_initial', name: 'Stage 1 Applicant Data', type: 'USER_TASK' },
      review1: { id: 'review1', name: 'Central Review Form 1', type: 'SERVICE_REVIEW' },
      stage1_send_registry: { id: 'stage1_send_registry', name: 'Send Stage1 To Registry', type: 'SERVICE_TASK' },
      sendAgency: { id: 'sendAgency', name: 'Send Consent OTP', type: 'SERVICE_TASK' },
      enterCode: { id: 'enterCode', name: 'Enter SMS Code', type: 'USER_TASK' },
      stage3_claim_confirm: { id: 'stage3_claim_confirm', name: 'Confirm Claim Info', type: 'USER_TASK' },
      stage4_send_registry: { id: 'stage4_send_registry', name: 'Send Stage4 Registry Inquiry', type: 'SERVICE_TASK' },
      stage4_registry_inquiry: { id: 'stage4_registry_inquiry', name: 'Registry Organization Inquiry', type: 'SERVICE_REVIEW' },
      tracking: { id: 'tracking', name: 'Show Registry Response', type: 'USER_TASK' },
      stage5_expert_visit: { id: 'stage5_expert_visit', name: 'Expert Visit', type: 'USER_TASK' },
      review5: { id: 'review5', name: 'Central Review Expert Visit', type: 'SERVICE_REVIEW' },
      stage5_send_registry: { id: 'stage5_send_registry', name: 'Send Stage5 Visit To Registry', type: 'SERVICE_TASK' },
      stage6_committee: { id: 'stage6_committee', name: 'Committee Response Wait', type: 'SERVICE_REVIEW' },
      stage7_announcement: { id: 'stage7_announcement', name: 'Committee Decision Announcement', type: 'USER_TASK' },
      stage8_objection: { id: 'stage8_objection', name: 'Objection Or Decision Finality Wait', type: 'SERVICE_REVIEW' },
      stage9_court_decision: { id: 'stage9_court_decision', name: 'Court Decision Upload', type: 'USER_TASK' },
      stage10_committee_review: { id: 'stage10_committee_review', name: 'Court Finality Confirmation Wait', type: 'SERVICE_REVIEW' },
      generate_document_fee: { id: 'generate_document_fee', name: 'Prepare Document Issuance Fee', type: 'SERVICE_TASK' },
      stage11_document_fee: { id: 'stage11_document_fee', name: 'Document Issuance Fee Payment', type: 'USER_TASK' },
      generate_announcement_fee: { id: 'generate_announcement_fee', name: 'Prepare Boundary Announcement Fee', type: 'SERVICE_TASK' },
      stage11_announcement_fee: { id: 'stage11_announcement_fee', name: 'Boundary Announcement Fee Payment', type: 'USER_TASK' },
      generate_land_owner_fee: { id: 'generate_land_owner_fee', name: 'Prepare Land Owner Fee', type: 'SERVICE_TASK' },
      stage11_land_owner_fee: { id: 'stage11_land_owner_fee', name: 'Land Owner Fee Payment', type: 'USER_TASK' },
      generate_issued_document: { id: 'generate_issued_document', name: 'Prepare Issued Document Stub', type: 'SERVICE_TASK' },
      stage12_issued: { id: 'stage12_issued', name: 'Display Issued Document', type: 'USER_TASK' },
      stage12_notify: { id: 'stage12_notify', name: 'Notify Applicant Deed Issued', type: 'SERVICE_TASK' },
      form2: { id: 'form2', name: 'Fill Form 2', type: 'USER_TASK' },
      review2: { id: 'review2', name: 'Central Review Form 2', type: 'SERVICE_REVIEW' },
      end: { id: 'end', name: 'End', type: 'END_EVENT' },
    },
    flows: [
      { from: 'start', to: 'generate' },
      { from: 'generate', to: 'payment' },
      { from: 'payment', to: 'stage1_initial' },
      { from: 'stage1_initial', to: 'review1' },
      { from: 'review1', to: 'stage1_send_registry' },
      { from: 'stage1_send_registry', to: 'sendAgency' },
      { from: 'sendAgency', to: 'enterCode' },
      { from: 'enterCode', to: 'stage3_claim_confirm' },
      { from: 'stage3_claim_confirm', to: 'stage4_send_registry' },
      { from: 'stage4_send_registry', to: 'stage4_registry_inquiry' },
      { from: 'stage4_registry_inquiry', to: 'tracking' },
      { from: 'tracking', to: 'stage5_expert_visit' },
      { from: 'stage5_expert_visit', to: 'end', condition: 'registry_inquiry_cannot_issue' },
      { from: 'stage5_expert_visit', to: 'review5' },
      { from: 'review5', to: 'stage5_send_registry', condition: 'approved' },
      { from: 'review5', to: 'stage5_expert_visit', condition: 'needs_correction' },
      { from: 'review5', to: 'end', condition: 'rejected' },
      { from: 'stage5_send_registry', to: 'stage6_committee' },
      { from: 'stage6_committee', to: 'stage7_announcement', condition: 'approved' },
      { from: 'stage6_committee', to: 'stage5_expert_visit', condition: 'needs_correction' },
      { from: 'stage6_committee', to: 'end', condition: 'rejected' },
      { from: 'stage7_announcement', to: 'stage8_objection' },
      { from: 'stage8_objection', to: 'stage9_court_decision', condition: 'objection' },
      { from: 'stage8_objection', to: 'generate_document_fee', condition: 'approved' },
      { from: 'stage8_objection', to: 'stage7_announcement', condition: 'needs_correction' },
      { from: 'stage8_objection', to: 'end', condition: 'rejected' },
      { from: 'generate_document_fee', to: 'stage11_document_fee' },
      { from: 'stage11_document_fee', to: 'generate_announcement_fee' },
      { from: 'generate_announcement_fee', to: 'stage11_announcement_fee', condition: 'announcement_fee_due' },
      { from: 'generate_announcement_fee', to: 'generate_land_owner_fee' },
      { from: 'stage11_announcement_fee', to: 'generate_land_owner_fee' },
      { from: 'generate_land_owner_fee', to: 'stage11_land_owner_fee', condition: 'land_owner_fee_due' },
      { from: 'generate_land_owner_fee', to: 'form2' },
      { from: 'stage11_land_owner_fee', to: 'form2' },
      { from: 'stage9_court_decision', to: 'stage10_committee_review' },
      { from: 'stage10_committee_review', to: 'generate_document_fee', condition: 'approved' },
      { from: 'stage10_committee_review', to: 'stage9_court_decision', condition: 'needs_correction' },
      { from: 'stage10_committee_review', to: 'end', condition: 'rejected' },
      { from: 'form2', to: 'review2' },
      { from: 'review2', to: 'form2', condition: 'needs_correction' },
      { from: 'review2', to: 'end', condition: 'rejected' },
      { from: 'review2', to: 'generate_issued_document', condition: 'approved' },
      { from: 'generate_issued_document', to: 'stage12_issued' },
      { from: 'stage12_issued', to: 'stage12_notify' },
      { from: 'stage12_notify', to: 'end' },
    ],
  },
};

/** @typedef {{ variables?: Record<string, unknown>, payload?: Record<string, unknown>, response?: Record<string, unknown>, completeForm?: Record<string, unknown>, note?: string }} ProcessStepSample */

/** نمونه form1 service4 — هم‌سبک Service4HappyPathVariables در test harness */
const SERVICE4_SAMPLE_FORM1 = {
  national_id: '0012345678',
  mobile: '09121234567',
  address: 'تهران، خیابان نمونه، پلاک ۱',
  sana_registration_status: 'registered',
  applicant_role: 'original',
  claim_registration_tracking_code: 'CLM-E2E-1',
  claim_map_match_status: 'yes',
  claim_ownership_type: 'ownership_of_ain',
  claim_belongs_to_applicant: 'yes',
  eligibility_possession_status: 'yes',
  eligibility_non_agri_land_without_building: 'no',
  eligibility_official_owner_access_status: 'partial',
};

/** @type {Record<string, unknown>} */
const SERVICE4_SAMPLE_VARS_BASE = {
  user_id: 'U-S4-E2E',
  service_type: 4,
  request_type: 1,
  form1: SERVICE4_SAMPLE_FORM1,
};

/** @type {Record<string, unknown>} */
const SERVICE4_SAMPLE_PAYMENT_DUE = {
  amount: 500000,
  currency: 'IRR',
  title: 'هزینه بررسی اولیه',
};

/** @type {Record<string, unknown>} */
const SERVICE4_SAMPLE_POS_COMPLETE = {
  pos_trace_number: 'POS-TRACE-9001',
  pos_request_id: 'POS-REQ-9001',
  pos_pan: '603799******1234',
  pos_amount: 500000,
  pos_approved: true,
};

/** @type {Record<string, unknown>} */
const SERVICE4_SAMPLE_EXPERT_VISIT = {
  registry_inquiry_cannot_issue: 'no',
  visit_expert_national_id: '1234567891',
  visit_date: '2025-06-10T00:00:00+03:30',
  visit_expert_personal_presence: 'yes',
  visit_possession_map_match_status: 'yes',
  visit_property_type: 'land',
  visit_property_usage: 'residential',
  visit_neighbor_easement_rights: 'no',
  visit_main_plaque_number: '12345',
  visit_registration_section: 'بخش ۱',
  visit_joint_share_total: '24',
  visit_joint_share_partial: '6',
  visit_possession_to_share_total: '6',
  visit_possession_to_share_partial: '3',
  visit_ownership_transfer_type: 'sale',
  visit_ownership_document_type: 'official_deed',
  visit_ownership_document_date: '2018-01-20',
  visit_ownership_document_image: 'ownership-doc.pdf',
  visit_last_official_owner: 'رضا احمدی',
  visit_possession_verification_status: 'established',
  visit_possession_location_image: 'location-photo.jpg',
  visit_possession_verification_description: 'تصرف در محل بازدید مشاهده شد.',
  visit_expert_regional_value: '1500000000',
};

/** @type {Record<string, ProcessStepSample>} */
const SERVICE4_STEP_SAMPLES = {
  start: {
    note: 'شروع فرایند — POST /api/engine/service/start/service4',
    variables: { ...SERVICE4_SAMPLE_VARS_BASE },
    completeForm: {
      service_type: 4,
      request_type: 1,
      branch_id: 1,
    },
    response: {
      instance_id: 42,
      process_key: 'service4',
      status: 'RUNNING',
      current_element_id: 'generate',
    },
  },
  generate: {
    note: 'ServiceTask — محاسبه fee_amount و payment_due',
    variables: { ...SERVICE4_SAMPLE_VARS_BASE },
    response: {
      fee_amount: 500000,
      payment_due: SERVICE4_SAMPLE_PAYMENT_DUE,
      request_id: 'REQ-S4-42',
    },
  },
  payment: {
    note: 'پرداخت POS — hook step_complete → payment.record_receipt',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      fee_amount: 500000,
      payment_due: SERVICE4_SAMPLE_PAYMENT_DUE,
      payment_actor: 'U-S4-E2E',
      __payment_submitted_by: 1,
      ...SERVICE4_SAMPLE_POS_COMPLETE,
    },
    completeForm: SERVICE4_SAMPLE_POS_COMPLETE,
    payload: {
      branch_id: 1,
      service_id: 4,
      process_instance_id: 42,
      process_definition_key: 'service4',
      process_step_id: 'payment',
      user_id: 1,
      applicant_user_id: 'U-S4-E2E',
      amount: 500000,
      payment_gateway: 'pc2pos',
      transaction_id: 'POS-TRACE-9001',
      reference_id: 'POS-REQ-9001',
      card_number: '603799******1234',
      process_status: 'RUNNING',
    },
    response: {
      data: {
        payment_id: 'PAY-S4-001',
        invoice_id: 'INV-S4-001',
      },
    },
  },
  stage1_initial: {
    note: 'مرحله ۱ — ارسال داده‌های اولیه متقاضی و ادعا',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      payment_record_id: 'PAY-S4-001',
    },
    completeForm: {
      form1: SERVICE4_SAMPLE_FORM1,
    },
  },
  review1: {
    note: 'SERVICE_REVIEW — بازبینی مرکزی قبل از stage1_send_registry',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      payment_record_id: 'PAY-S4-001',
    },
    completeForm: {
      review_status: 'approved',
      review_comment: 'اطلاعات اولیه تأیید شد.',
    },
  },
  stage1_send_registry: {
    note: 'ServiceTask async_wait — POST /service4/stage1',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      payment_record_id: 'PAY-S4-001',
      review1_status: 'approved',
    },
    payload: {
      applicant_id: 'U-S4-E2E',
      national_id: '0012345678',
      mobile: '09121234567',
      stage1_payload: SERVICE4_SAMPLE_FORM1,
      process_key: 'service4',
      instance_id: 42,
      branch_id: 1,
      service_type: 4,
      step: 'stage1_send_registry',
    },
    response: {
      reference_id: 'REG-S4-STAGE1',
      status: 'SUBMITTED',
      message: 'Service4 stage1 application accepted',
    },
  },
  sendAgency: {
    note: 'ServiceTask sync — ارسال OTP رضایت (notification.send_otp)',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      registry_reference_id: 'REG-S4-STAGE1',
      registry_status: 'APPROVED',
      otp_consent_code: '482910',
    },
    payload: {
      mobile: '09121234567',
      code: '482910',
      national_id: '0012345678',
      process_key: 'service4',
      instance_id: 42,
      branch_id: 1,
      service_type: 4,
      step: 'sendAgency',
    },
    response: {
      sent: true,
      channel: 'sms',
    },
  },
  enterCode: {
    note: 'مرحله ۲ — اخذ رضایت متقاضی (OTP/SMS)',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      otp_consent_code: '482910',
      otp_sent: true,
    },
    completeForm: {
      sms_code: '482910',
    },
    response: {
      otp_consent_verified: true,
    },
  },
  stage3_claim_confirm: {
    note: 'مرحله ۳ — تأیید اطلاعات ادعا توسط متقاضی',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      otp_consent_verified: true,
    },
    completeForm: {
      claimConfirmation: {
        claim_confirmed: true,
      },
    },
  },
  stage4_send_registry: {
    note: 'ServiceTask async_wait — POST /service4/stage4/inquiry',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      otp_consent_verified: true,
      claim_map_data: {
        tracking_code: 'CLM-E2E-1',
        match_status: 'yes',
      },
    },
    payload: {
      applicant_id: 'U-S4-E2E',
      national_id: '0012345678',
      mobile: '09121234567',
      claim_map_data: {
        tracking_code: 'CLM-E2E-1',
        match_status: 'yes',
      },
      stage4_payload: SERVICE4_SAMPLE_FORM1,
      process_key: 'service4',
      instance_id: 42,
      branch_id: 1,
      service_type: 4,
      step: 'stage4_send_registry',
    },
    response: {
      reference_id: 'REG-S4-STAGE4',
      status: 'APPROVED',
      message: 'Organization registry inquiry completed',
    },
  },
  stage4_registry_inquiry: {
    note: 'SERVICE_REVIEW — مرحله ۴ استعلام ثبتی سازمان',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      registry_reference_id: 'REG-S4-STAGE4',
      registry_status: 'APPROVED',
      registry_response: {
        reference_id: 'REG-S4-STAGE4',
        status: 'APPROVED',
        can_issue: true,
      },
    },
    completeForm: {
      review_status: 'approved',
      review_comment: 'استعلام ثبتی مثبت.',
    },
  },
  tracking: {
    note: 'نمایش پاسخ ثبت — registry_response_form',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      registry_reference_id: 'REG-S4-STAGE4',
      registry_status: 'APPROVED',
      registry_response: {
        reference_id: 'REG-S4-STAGE4',
        status: 'APPROVED',
        message: 'Organization registry inquiry completed',
      },
    },
    completeForm: {
      is_completed: true,
    },
  },
  stage5_expert_visit: {
    note: 'مرحله ۵ — بازدید کارشناس امور ثبتی و حقوقی',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      registry_response: {
        reference_id: 'REG-S4-STAGE4',
        status: 'APPROVED',
      },
    },
    completeForm: {
      expertVisit: SERVICE4_SAMPLE_EXPERT_VISIT,
    },
  },
  review5: {
    note: 'SERVICE_REVIEW — تأیید بازدید قبل از stage5_send_registry',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      expertVisit: SERVICE4_SAMPLE_EXPERT_VISIT,
    },
    completeForm: {
      review_status: 'approved',
      review_comment: 'بازدید کارشناس تأیید شد.',
    },
  },
  stage5_send_registry: {
    note: 'ServiceTask async_wait — POST /service4/stage5/visit',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      expertVisit: SERVICE4_SAMPLE_EXPERT_VISIT,
      registry_reference_id: 'REG-S4-STAGE4',
    },
    payload: {
      applicant_id: 'U-S4-E2E',
      national_id: '0012345678',
      mobile: '09121234567',
      stage5_payload: SERVICE4_SAMPLE_EXPERT_VISIT,
      claim_map_data: {
        tracking_code: 'CLM-E2E-1',
        match_status: 'yes',
      },
      registry_reference_id: 'REG-S4-STAGE4',
      process_key: 'service4',
      instance_id: 42,
      branch_id: 1,
      service_type: 4,
      step: 'stage5_send_registry',
    },
    response: {
      reference_id: 'REG-S4-STAGE5',
      status: 'SUBMITTED',
      committee_tracking_no: 'CMT-MOCK-9001',
      hearing_at: '2026-08-01T10:00:00Z',
    },
  },
  stage6_committee: {
    note: 'SERVICE_REVIEW — مرحله ۶ انتظار پاسخ هیئت تعیین تکلیف',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      committee_tracking_no: 'CMT-MOCK-9001',
      hearing_at: '2026-08-01T10:00:00Z',
    },
    completeForm: {
      review_status: 'approved',
      review_comment: 'رأی هیئت دریافت شد.',
    },
    response: {
      correlation_id: '42:stage6_committee:1',
      status: 'APPROVED',
      committee_decision: 'issue_deed',
    },
  },
  stage7_announcement: {
    note: 'مرحله ۷ — انتشار آگهی رأی هیئت (دو نوبت)',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      committee_tracking_no: 'CMT-MOCK-9001',
    },
    completeForm: {
      announcement: {
        announcement_round1_wide_date: '1404/01/15',
        announcement_round1_wide_name: 'کیهان',
        announcement_round1_wide_image: 'round1-wide.jpg',
        announcement_round1_local_date: '1404/01/16',
        announcement_round1_local_name: 'اطلاعات قزوین',
        announcement_round1_local_image: 'round1-local.jpg',
        announcement_round2_wide_date: '1404/02/15',
        announcement_round2_wide_name: 'ایران',
        announcement_round2_wide_image: 'round2-wide.jpg',
        announcement_round2_local_date: '1404/02/16',
        announcement_round2_local_name: 'شهروند قزوین',
        announcement_round2_local_image: 'round2-local.jpg',
      },
    },
  },
  stage8_objection: {
    note: 'SERVICE_REVIEW — مرحله ۸ اعلام وجود/فقدان اعتراض',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      announcement_completed: true,
      objection: false,
    },
    completeForm: {
      review_status: 'approved',
      review_comment: 'مهلت اعتراض بدون اعتراض سپری شد.',
    },
    response: {
      status: 'APPROVED',
      objection: false,
    },
  },
  stage9_court_decision: {
    note: 'مرحله ۹ — ارسال رأی دادگاه (شاخه اعتراض)',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      objection: true,
      registry_status_m13: 'OBJECTION',
    },
    completeForm: {
      court_decision: {
        court_decision_date: '1404/04/10',
        court_decision_image: 'court-ruling.pdf',
        expert_national_id: '1234567891',
        expert_objection_rejection_opinion: 'verified',
        expert_objection_description: 'رد اعتراض مطابق رأی دادگاه احراز شد.',
      },
    },
  },
  stage10_committee_review: {
    note: 'SERVICE_REVIEW — مرحله ۱۰ بررسی رأی دادگاه توسط دبیرخانه',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      objection: true,
      court_decision_date: '1404/04/10',
    },
    completeForm: {
      review_status: 'approved',
      review_comment: 'قطعیت رأی دادگاه تأیید شد.',
    },
    response: {
      status: 'APPROVED',
      court_finality: true,
    },
  },
  generate_document_fee: {
    note: 'ServiceTask — آماده‌سازی payment_due از deed_fee',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      deed_fee: 2500000,
    },
    response: {
      payment_due: {
        amount: 2500000,
        currency: 'IRR',
        title: 'هزینه صدور سند',
      },
    },
  },
  stage11_document_fee: {
    note: 'مرحله ۱۱ — پرداخت هزینه صدور سند',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      payment_due: {
        amount: 2500000,
        currency: 'IRR',
        title: 'هزینه صدور سند',
      },
      pos_trace_number: 'POS-TRACE-DOC-01',
      pos_request_id: 'POS-REQ-DOC-01',
      pos_pan: '603799******5678',
      pos_amount: 2500000,
    },
    completeForm: {
      pos_trace_number: 'POS-TRACE-DOC-01',
      pos_request_id: 'POS-REQ-DOC-01',
      pos_pan: '603799******5678',
      pos_amount: 2500000,
      pos_approved: true,
    },
    payload: {
      branch_id: 1,
      service_id: 4,
      process_instance_id: 42,
      process_definition_key: 'service4',
      process_step_id: 'stage11_document_fee',
      amount: 2500000,
      payment_gateway: 'pc2pos',
      transaction_id: 'POS-TRACE-DOC-01',
    },
    response: {
      data: {
        payment_id: 'PAY-S4-DOC-01',
        invoice_id: 'INV-S4-DOC-01',
      },
    },
  },
  generate_announcement_fee: {
    note: 'ServiceTask — آماده‌سازی هزینه آگهی تحدید حدود',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      announcement_fee_due: true,
      announcement_fee: 800000,
    },
    response: {
      payment_due: {
        amount: 800000,
        currency: 'IRR',
        title: 'هزینه آگهی تحدید حدود',
      },
    },
  },
  stage11_announcement_fee: {
    note: 'مرحله ۱۱ — پرداخت هزینه آگهی تحدید حدود',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      payment_due: {
        amount: 800000,
        currency: 'IRR',
        title: 'هزینه آگهی تحدید حدود',
      },
    },
    completeForm: {
      pos_trace_number: 'POS-TRACE-ANN-01',
      pos_request_id: 'POS-REQ-ANN-01',
      pos_amount: 800000,
      pos_approved: true,
    },
    payload: {
      process_step_id: 'stage11_announcement_fee',
      amount: 800000,
      payment_gateway: 'pc2pos',
    },
    response: {
      data: { payment_id: 'PAY-S4-ANN-01' },
    },
  },
  generate_land_owner_fee: {
    note: 'ServiceTask — آماده‌سازی هزینه ماده ۱۲ (ارزش منطقه‌ای)',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      land_owner_fee_due: true,
      land_owner_fee: 1200000,
    },
    response: {
      payment_due: {
        amount: 1200000,
        currency: 'IRR',
        title: 'هزینه ماده ۱۲',
      },
    },
  },
  stage11_land_owner_fee: {
    note: 'مرحله ۱۱ — پرداخت هزینه ماده ۱۲',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      payment_due: {
        amount: 1200000,
        currency: 'IRR',
        title: 'هزینه ماده ۱۲',
      },
    },
    completeForm: {
      pos_trace_number: 'POS-TRACE-LND-01',
      pos_amount: 1200000,
      pos_approved: true,
    },
    payload: {
      process_step_id: 'stage11_land_owner_fee',
      amount: 1200000,
    },
    response: {
      data: { payment_id: 'PAY-S4-LND-01' },
    },
  },
  form2: {
    note: 'آگهی تحدید حدود + تحویل سند (form2)',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      document_fee_paid: true,
    },
    completeForm: {
      boundary_announcement: {
        boundary_announcement_round1_wide_date: '1404/05/01',
        boundary_announcement_round1_wide_name: 'کیهان',
        boundary_announcement_round1_wide_image: 'boundary-r1-wide.jpg',
        boundary_announcement_round2_wide_date: '1404/06/01',
        boundary_announcement_round2_wide_name: 'ایران',
        boundary_announcement_round2_wide_image: 'boundary-r2-wide.jpg',
      },
      document_delivery: {
        document_delivery_recipient_name: 'علی رضایی',
        document_delivery_recipient_national_id: '1234567891',
        document_delivery_recipient_mobile: '09123456789',
        document_delivery_province: 1,
        document_delivery_registration_unit: 10,
        document_delivery_postal_code: '1234567890',
        document_delivery_address: 'تهران، خیابان نمونه، پلاک ۱',
      },
    },
  },
  review2: {
    note: 'SERVICE_REVIEW — بازبینی form2 قبل از صدور سند',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      boundary_announcement_completed: true,
    },
    completeForm: {
      review_status: 'approved',
      review_comment: 'آگهی تحدید و تحویل تأیید شد.',
    },
  },
  generate_issued_document: {
    note: 'ServiceTask — stub شماره و لینک سند صادرشده',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      review2_status: 'approved',
    },
    response: {
      issued_document_number: 'DEED-S4-1700000000',
      issued_document_date: '2026-06-20T12:00:00Z',
      issued_document_download_url: 'https://registry.example/deed/DEED-S4-1700000000.pdf',
    },
  },
  stage12_issued: {
    note: 'مرحله ۱۲ — نمایش سند صادرشده',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      issued_document_number: 'DEED-S4-1700000000',
      issued_document_date: '2026-06-20T12:00:00Z',
      issued_document_download_url: 'https://registry.example/deed/DEED-S4-1700000000.pdf',
    },
    completeForm: {
      is_completed: true,
    },
  },
  stage12_notify: {
    note: 'ServiceTask — اطلاع‌رسانی SMS صدور سند',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      issued_document_number: 'DEED-S4-1700000000',
    },
    payload: {
      mobile: '09121234567',
      message: 'سند شما با شماره DEED-S4-1700000000 صادر شد.',
      process_key: 'service4',
      instance_id: 42,
    },
    response: {
      sent: true,
      status: 'completed',
      completion_sms_sent: true,
    },
  },
  end: {
    note: 'پایان موفق فرایند',
    variables: {
      ...SERVICE4_SAMPLE_VARS_BASE,
      status: 'completed',
      registry_status: 'SUCCESS',
      issued_document_number: 'DEED-S4-1700000000',
      completion_sms_sent: true,
    },
  },
};

/** @type {Record<string, Record<string, ProcessStepSample>>} */
export const PROCESS_STEP_SAMPLES = {
  service4: SERVICE4_STEP_SAMPLES,
};

const TYPE_LABELS = {
  USER_TASK: 'User Task',
  SERVICE_TASK: 'Service Task',
  SERVICE_REVIEW: 'Service Review',
  START_EVENT: 'Start',
  END_EVENT: 'End',
  EXCLUSIVE_GATEWAY: 'Gateway',
};

export function processBpmnTypeLabel(type) {
  return TYPE_LABELS[type] ?? type ?? '—';
}

/** @type {Record<string, ReturnType<typeof normalizeApiBpmnModel>>} */
const apiBpmnModelCache = {};

/** @param {Record<string, unknown>|null|undefined} bpmn */
export function normalizeApiBpmnModel(bpmn) {
  if (!bpmn || typeof bpmn !== 'object') return null;

  const rawElements = bpmn.elements ?? bpmn.Elements ?? {};
  const elements = {};
  Object.entries(rawElements).forEach(([id, el]) => {
    if (!el || typeof el !== 'object') return;
    const elementId = String(el.id ?? el.ID ?? id);
    elements[elementId] = {
      id: elementId,
      name: String(el.name ?? el.Name ?? elementId),
      type: String(el.type ?? el.Type ?? ''),
    };
  });

  const rawFlows = bpmn.flows ?? bpmn.Flows ?? [];
  const flows = (Array.isArray(rawFlows) ? rawFlows : [])
    .map((flow) => {
      if (!flow || typeof flow !== 'object') return null;
      const from = String(flow.from ?? flow.From ?? '').trim();
      const to = String(flow.to ?? flow.To ?? '').trim();
      if (!from || !to) return null;
      return { from, to };
    })
    .filter(Boolean);

  const startId = String(bpmn.start_id ?? bpmn.startId ?? bpmn.StartID ?? bpmn.StartId ?? '').trim();
  if (!startId || Object.keys(elements).length === 0) return null;

  return {
    name: String(bpmn.name ?? bpmn.Name ?? ''),
    startId,
    elements,
    flows,
  };
}

function stepsFromModel(model) {
  if (!model) return [];

  const order = [];
  const seen = new Set();
  const adjacency = new Map();

  model.flows.forEach(({ from, to }) => {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
  });

  const walk = (nodeId) => {
    if (seen.has(nodeId)) return;
    seen.add(nodeId);
    order.push(nodeId);
    (adjacency.get(nodeId) ?? []).forEach(walk);
  };

  walk(model.startId);

  Object.keys(model.elements).forEach((id) => {
    if (!seen.has(id)) order.push(id);
  });

  return order
    .map((id) => model.elements[id])
    .filter(Boolean)
    .map((el) => ({ id: el.id, name: el.name, type: el.type }));
}

/** @param {string} processKey */
export function getProcessBpmnModel(processKey) {
  const key = String(processKey ?? '').trim();
  if (!key) return null;
  return PROCESS_BPMN_MODELS[key] ?? apiBpmnModelCache[key] ?? null;
}

/** @param {string} processKey @returns {BpmnStep[]} */
export function getProcessBpmnSteps(processKey) {
  return stepsFromModel(getProcessBpmnModel(processKey));
}

/** بارگذاری مدل BPMN — ابتدا cache محلی، سپس API موتور */
export async function loadProcessBpmnModel(processKey) {
  const key = String(processKey ?? '').trim();
  if (!key) return null;

  const cached = getProcessBpmnModel(key);
  if (cached) return cached;

  try {
    const detail = await getProcessDefinition(key);
    const model = normalizeApiBpmnModel(detail?.bpmn_json);
    if (model) {
      if (!model.name && detail?.name) {
        model.name = detail.name;
      }
      apiBpmnModelCache[key] = model;
      return model;
    }
  } catch {
    /* fallback: no model */
  }
  return null;
}

/** مراحل BPMN — با fallback به API اگر در cache UI نباشد */
export async function loadProcessBpmnSteps(processKey) {
  const model = await loadProcessBpmnModel(processKey);
  return stepsFromModel(model);
}

/** پیشنهاد hook_type بر اساس نوع مرحله */
export function suggestHookType(step) {
  if (!step) return 'service_task';
  if (step.type === 'EXCLUSIVE_GATEWAY') return 'gateway_condition';
  if (step.type === 'SERVICE_TASK') return 'service_task';
  if (step.type === 'USER_TASK' && /^payment/i.test(step.id)) return 'step_complete';
  if (step.type === 'SERVICE_REVIEW') return 'step_complete';
  return 'step_enter';
}

/** @deprecated از listProcessDefinitions() استفاده کنید */
export const PROCESS_KEY_OPTIONS = [
  { value: 'service1', label: 'خدمت شماره یک' },
  { value: 'service2', label: 'خدمت شماره دو' },
  { value: 'service3', label: 'خدمت شماره سه' },
  { value: 'service4', label: 'خدمت شماره چهار' },
];

/** تبدیل تعاریف API به گزینه‌های selector */
export function processDefinitionsToOptions(definitions) {
  return (definitions ?? []).map((def) => ({
    value: def.key,
    label: def.name || def.key,
  }));
}

/**
 * نمونه payload/response/variables یک مرحله BPMN (برای admin integration mapping).
 * @param {string} processKey
 * @param {string} stepId
 * @returns {ProcessStepSample|null}
 */
export function getProcessStepSample(processKey, stepId) {
  const key = String(processKey ?? '').trim();
  const id = String(stepId ?? '').trim();
  if (!key || !id) return null;
  return PROCESS_STEP_SAMPLES[key]?.[id] ?? null;
}

/** @param {string} processKey @param {string} stepId */
export function getProcessStepSampleVariables(processKey, stepId) {
  return getProcessStepSample(processKey, stepId)?.variables ?? null;
}

/** @param {string} processKey @param {string} stepId */
export function getProcessStepSamplePayload(processKey, stepId) {
  return getProcessStepSample(processKey, stepId)?.payload ?? null;
}

/** @param {string} processKey @param {string} stepId */
export function getProcessStepSampleResponse(processKey, stepId) {
  return getProcessStepSample(processKey, stepId)?.response ?? null;
}

/** @param {string} processKey @param {string} stepId */
export function getProcessStepSampleCompleteForm(processKey, stepId) {
  return getProcessStepSample(processKey, stepId)?.completeForm ?? null;
}

/** @param {unknown} value */
export function formatProcessStepSampleJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

/** @param {string} processKey @returns {string[]} */
export function listProcessStepSampleIds(processKey) {
  const key = String(processKey ?? '').trim();
  if (!key) return [];
  return Object.keys(PROCESS_STEP_SAMPLES[key] ?? {});
}
