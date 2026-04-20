import { z } from 'zod';

// ---------------- STEP 0 ----------------
export const step0Schema = z.object({
  request_type: z.number().min(1, 'نوع درخواست الزامی است'),
  contract_number: z.string().min(1, 'شماره قرارداد الزامی است'),
  contract_date: z.string().min(1, 'تاریخ قرارداد الزامی است'),
  service_type: z.number().min(1, 'نوع خدمت الزامی است'),
  request_description: z.string().optional(),
});

// ---------------- STEP 1 ----------------
export const step1Schema = z.object({
  applicant_name: z.string().min(1, 'نام الزامی است'),
  applicant_family: z.string().min(1, 'نام خانوادگی الزامی است'),
  national_id: z.string().min(10, 'کد ملی نامعتبر است'),
  mobile: z.string().min(10, 'موبایل نامعتبر است'),
  email: z.string().email('ایمیل نامعتبر است').optional().or(z.literal('')),
  address: z.string().optional(),
});

// ---------------- STEP 2 (اطلاعات مکانی / اگر داری) ----------------
export const step2Schema = z.object({
  // اگر هنوز فیلدی نداری این خالی می‌مونه تا trigger fail نشه
});

// ---------------- STEP 3 (ملک + مالی) ----------------
export const step3Schema = z.object({
  total_amount: z.coerce.number().min(0, 'مبلغ کل باید مثبت باشد'),
  discount: z.coerce.number().min(0).optional().default(0),
  final_amount: z.coerce.number().min(0),
  extra_description: z.string().optional(),
  attachment: z.string().optional(),
});

// ---------------- STEP 4 ----------------
export const step4Schema = z.object({
  // دسترسی به دیگران (اگر بعداً فیلد اضافه شد اینجا)
});

// ---------------- STEP 5 ----------------
export const step5Schema = z.object({
  // تخصیص کارشناس (فعلاً خالی برای جلوگیری از error)
});

// ---------------- EXPORT ARRAY ----------------
export const stepSchemas = [
  step0Schema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
];
