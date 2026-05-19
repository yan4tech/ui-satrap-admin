import { z as zod } from 'zod';

import { BRANCH_AFFILIATION, REVIEW_POLICY } from 'src/lib/branch-workflow';

export const branchWorkflowZodFields = {
  branch_affiliation: zod.enum([BRANCH_AFFILIATION.INDEPENDENT, BRANCH_AFFILIATION.CORPORATE], {
    required_error: 'نوع شعبه الزامی است',
  }),
  review_policy: zod.enum([REVIEW_POLICY.REQUIRED, REVIEW_POLICY.NONE], {
    required_error: 'سیاست بازبینی الزامی است',
  }),
  company_id: zod.string().optional(),
};

export function branchWorkflowSuperRefine(data, ctx) {
  if (data.branch_affiliation === BRANCH_AFFILIATION.CORPORATE) {
    const cid = Number(data.company_id);
    if (!Number.isFinite(cid) || cid < 1) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'برای شعبه شرکتی انتخاب شرکت الزامی است',
        path: ['company_id'],
      });
    }
  }
}
