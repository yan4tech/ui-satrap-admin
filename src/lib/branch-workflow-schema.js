import { z as zod } from 'zod';

import { BRANCH_AFFILIATION, REVIEW_POLICY } from 'src/lib/branch-workflow';

const BRANCH_AFFILIATION_VALUES = [
  BRANCH_AFFILIATION.INDEPENDENT,
  BRANCH_AFFILIATION.SUB,
  BRANCH_AFFILIATION.CENTRAL,
];

export const branchWorkflowZodFields = {
  branch_affiliation: zod.enum(BRANCH_AFFILIATION_VALUES, {
    required_error: 'نوع شعبه الزامی است',
  }),
  review_policy: zod.enum([REVIEW_POLICY.REQUIRED, REVIEW_POLICY.NONE], {
    required_error: 'سیاست بازبینی الزامی است',
  }),
  parent_branch_id: zod.string().optional(),
  max_sub_branches: zod.coerce.number().int().min(0).optional(),
};

export function branchWorkflowSuperRefine(data, ctx) {
  if (data.branch_affiliation === BRANCH_AFFILIATION.SUB) {
    const pid = Number(data.parent_branch_id);
    if (!Number.isFinite(pid) || pid < 1) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'برای زیرشعبه انتخاب شعبه مرکزی الزامی است',
        path: ['parent_branch_id'],
      });
    }
  }
}
