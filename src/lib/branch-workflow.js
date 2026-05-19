/** API branch_kind values (membership). */
export const BRANCH_KIND = {
  INDEPENDENT_REVIEW: 'independent_with_review',
  INDEPENDENT_NO_REVIEW: 'independent_no_review',
  CORPORATE: 'corporate',
};

/** UI: مستقل | شرکتی */
export const BRANCH_AFFILIATION = {
  INDEPENDENT: 'independent',
  CORPORATE: 'corporate',
};

/** UI: بازبینی اجباری | بدون نیاز به بازبینی */
export const REVIEW_POLICY = {
  REQUIRED: 'required',
  NONE: 'none',
};

export const AFFILIATION_OPTIONS = [
  {
    value: BRANCH_AFFILIATION.INDEPENDENT,
    label: 'مستقل',
    description: 'شعبه زیرمجموعه شرکت نیست؛ بازبینی توسط سازمان مرکزی (در صورت فعال بودن).',
  },
  {
    value: BRANCH_AFFILIATION.CORPORATE,
    label: 'شرکتی',
    description: 'شعبه زیرمجموعه یک شرکت است؛ بازبینی توسط کاربران بازبینی همان شرکت (در صورت فعال بودن).',
  },
];

export const REVIEW_POLICY_OPTIONS = [
  {
    value: REVIEW_POLICY.REQUIRED,
    label: 'بازبینی اجباری',
    description: 'فرم‌ها باید توسط بازبین مجاز تأیید شوند.',
  },
  {
    value: REVIEW_POLICY.NONE,
    label: 'بدون نیاز به بازبینی',
    description: 'مرحله بازبینی در فرایند به‌صورت خودکار تکمیل و پرونده به مرحله بعد می‌رود.',
  },
];

export const REVIEW_PARTY_LABELS = {
  auto: 'بدون بازبینی (خودکار)',
  central: 'سازمان مرکزی',
  company: 'بازبینی شرکت',
};

export function branchFormValuesFromBranch(branch) {
  const companyId = Number(branch?.company_id ?? branch?.CompanyID ?? 0);
  const reviewRequired = branch?.review_required !== false && branch?.ReviewRequired !== false;

  if (companyId > 0) {
    return {
      branch_affiliation: BRANCH_AFFILIATION.CORPORATE,
      review_policy: reviewRequired ? REVIEW_POLICY.REQUIRED : REVIEW_POLICY.NONE,
      company_id: String(companyId),
    };
  }

  return {
    branch_affiliation: BRANCH_AFFILIATION.INDEPENDENT,
    review_policy: reviewRequired ? REVIEW_POLICY.REQUIRED : REVIEW_POLICY.NONE,
    company_id: '',
  };
}

export function affiliationReviewToPayload(affiliation, reviewPolicy, { companyId } = {}) {
  const reviewRequired = reviewPolicy === REVIEW_POLICY.REQUIRED;

  if (affiliation === BRANCH_AFFILIATION.CORPORATE) {
    const cid = Number(companyId);
    return {
      branch_kind: BRANCH_KIND.CORPORATE,
      company_id: Number.isFinite(cid) && cid > 0 ? cid : undefined,
      review_required: reviewRequired,
    };
  }

  return {
    branch_kind: reviewRequired ? BRANCH_KIND.INDEPENDENT_REVIEW : BRANCH_KIND.INDEPENDENT_NO_REVIEW,
    review_required: reviewRequired,
  };
}

/** @deprecated use branchFormValuesFromBranch */
export function resolveBranchKindFromBranch(branch) {
  const { branch_affiliation, review_policy } = branchFormValuesFromBranch(branch);
  if (branch_affiliation === BRANCH_AFFILIATION.CORPORATE) return BRANCH_KIND.CORPORATE;
  return review_policy === REVIEW_POLICY.NONE
    ? BRANCH_KIND.INDEPENDENT_NO_REVIEW
    : BRANCH_KIND.INDEPENDENT_REVIEW;
}

export function branchAssignmentsFromSelection(branches) {
  return (branches ?? [])
    .map((b) => ({
      branch_id: Number(b?.id ?? b?.ID ?? 0),
      review_required: b?.review_required !== false,
    }))
    .filter((a) => a.branch_id > 0);
}

export function describeBranchWorkflow(affiliation, reviewPolicy) {
  const aff =
    AFFILIATION_OPTIONS.find((o) => o.value === affiliation)?.label ?? affiliation;
  const rev =
    REVIEW_POLICY_OPTIONS.find((o) => o.value === reviewPolicy)?.label ?? reviewPolicy;
  return `${aff} — ${rev}`;
}
