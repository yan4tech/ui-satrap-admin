/** API branch_kind values (membership). */
export const BRANCH_KIND = {
  INDEPENDENT_REVIEW: 'independent_with_review',
  INDEPENDENT_NO_REVIEW: 'independent_no_review',
  SUB_BRANCH: 'sub_branch',
};

/** UI: مستقل | زیرمجموعه شعبه مرکزی | شعبه مرکزی */
export const BRANCH_AFFILIATION = {
  INDEPENDENT: 'independent',
  SUB: 'sub',
  CENTRAL: 'central',
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
    description: 'شعبه زیرمجموعه شعبه مرکزی نیست؛ بازبینی توسط شعبه مرکزی والد (در صورت فعال بودن).',
  },
  {
    value: BRANCH_AFFILIATION.SUB,
    label: 'زیرمجموعه شعبه مرکزی',
    description: 'شعبه زیرمجموعه یک شعبه مرکزی است؛ بازبینی توسط کاربران همان شعبه مرکزی (در صورت فعال بودن).',
  },
  {
    value: BRANCH_AFFILIATION.CENTRAL,
    label: 'شعبه مرکزی',
    description: 'می‌تواند زیرشعه داشته باشد، به آن‌ها خدمات اختصاص دهد و سقف تعداد زیرشعب تعیین کند.',
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
  central: 'بازبینی شعبه مرکزی والد',
  parent_branch: 'بازبینی شعبه مرکزی',
  hierarchical: 'بازبینی سلسله‌مراتبی (چند سطح)',
  company: 'بازبینی شعبه مرکزی',
};

export function isCentralBranchAffiliation(affiliation) {
  return affiliation === BRANCH_AFFILIATION.CENTRAL;
}

export function centralBranchFieldsFromAffiliation(affiliation, maxSubBranches) {
  if (!isCentralBranchAffiliation(affiliation)) {
    return { is_central: false, max_sub_branches: 0 };
  }
  return {
    is_central: true,
    max_sub_branches: Number(maxSubBranches) || 0,
  };
}

export function branchFormValuesFromBranch(branch) {
  const parentId = Number(branch?.parent_branch_id ?? branch?.ParentBranchID ?? 0);
  const reviewRequired = branch?.review_required !== false && branch?.ReviewRequired !== false;
  const isCentral = Boolean(branch?.is_central ?? branch?.IsCentral);

  if (isCentral) {
    return {
      branch_affiliation: BRANCH_AFFILIATION.CENTRAL,
      review_policy: reviewRequired ? REVIEW_POLICY.REQUIRED : REVIEW_POLICY.NONE,
      parent_branch_id: parentId > 0 ? String(parentId) : '',
      max_sub_branches: branch?.max_sub_branches ?? branch?.MaxSubBranches ?? 0,
    };
  }

  if (parentId > 0) {
    return {
      branch_affiliation: BRANCH_AFFILIATION.SUB,
      review_policy: reviewRequired ? REVIEW_POLICY.REQUIRED : REVIEW_POLICY.NONE,
      parent_branch_id: String(parentId),
    };
  }

  return {
    branch_affiliation: BRANCH_AFFILIATION.INDEPENDENT,
    review_policy: reviewRequired ? REVIEW_POLICY.REQUIRED : REVIEW_POLICY.NONE,
    parent_branch_id: '',
  };
}

function parentBranchIdField(parentBranchId, { allowClear = false } = {}) {
  const pid = Number(parentBranchId);
  if (Number.isFinite(pid) && pid > 0) {
    return { parent_branch_id: pid };
  }
  if (allowClear) {
    return { parent_branch_id: 0 };
  }
  return {};
}

export function affiliationReviewToPayload(affiliation, reviewPolicy, { parentBranchId } = {}) {
  const reviewRequired = reviewPolicy === REVIEW_POLICY.REQUIRED;

  if (isCentralBranchAffiliation(affiliation)) {
    return {
      branch_kind: reviewRequired ? BRANCH_KIND.INDEPENDENT_REVIEW : BRANCH_KIND.INDEPENDENT_NO_REVIEW,
      review_required: reviewRequired,
      ...parentBranchIdField(parentBranchId, { allowClear: true }),
    };
  }

  if (affiliation === BRANCH_AFFILIATION.SUB) {
    return {
      branch_kind: BRANCH_KIND.SUB_BRANCH,
      ...parentBranchIdField(parentBranchId),
      review_required: reviewRequired,
    };
  }

  return {
    branch_kind: reviewRequired ? BRANCH_KIND.INDEPENDENT_REVIEW : BRANCH_KIND.INDEPENDENT_NO_REVIEW,
    review_required: reviewRequired,
    parent_branch_id: 0,
  };
}

export function resolveBranchKindFromBranch(branch) {
  const { branch_affiliation, review_policy } = branchFormValuesFromBranch(branch);
  if (isCentralBranchAffiliation(branch_affiliation)) {
    return review_policy === REVIEW_POLICY.NONE
      ? BRANCH_KIND.INDEPENDENT_NO_REVIEW
      : BRANCH_KIND.INDEPENDENT_REVIEW;
  }
  if (branch_affiliation === BRANCH_AFFILIATION.SUB) return BRANCH_KIND.SUB_BRANCH;
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

export function describeBranchWorkflow(affiliation, reviewPolicy, maxSubBranches) {
  const aff =
    AFFILIATION_OPTIONS.find((o) => o.value === affiliation)?.label ?? affiliation;
  const rev =
    REVIEW_POLICY_OPTIONS.find((o) => o.value === reviewPolicy)?.label ?? reviewPolicy;
  if (isCentralBranchAffiliation(affiliation)) {
    const max = Number(maxSubBranches);
    const quota =
      !max || max <= 0 ? '' : ` · سقف ${max} زیرشعه`;
    return `${aff}${quota} — ${rev}`;
  }
  return `${aff} — ${rev}`;
}
