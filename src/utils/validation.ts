/**
 * Validation utilities for forms
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate vehicle bulk create form
 */
export interface VehicleBulkFormData {
  model: string;
  year: number | string;
  color: string;
  type: 'scooter' | 'motorcycle' | string;
  batteryCapacity: number | string;
  maxRange: number | string;
  pricePerDay: number | string;
  depositPercentage: number | string;
  quantity: number | string;
}

export function validateVehicleBulkForm(formData: VehicleBulkFormData): ValidationResult {
  const errors: ValidationError[] = [];

  // Model validation
  if (!formData.model || !formData.model.trim()) {
    errors.push({ field: 'model', message: 'Model là bắt buộc' });
  } else if (formData.model.trim().length < 2) {
    errors.push({ field: 'model', message: 'Model phải có ít nhất 2 ký tự' });
  } else if (formData.model.trim().length > 50) {
    errors.push({ field: 'model', message: 'Model không được vượt quá 50 ký tự' });
  }

  // Year validation
  if (!formData.year || formData.year === '') {
    errors.push({ field: 'year', message: 'Năm sản xuất là bắt buộc' });
  } else {
    const yearStr = String(formData.year).trim();
    const year = parseInt(yearStr, 10);
    if (!yearStr || isNaN(year) || year < 2000 || year > 2030) {
      errors.push({ field: 'year', message: 'Năm sản xuất phải từ 2000 đến 2030' });
    }
  }

  // Color validation
  if (!formData.color || !formData.color.trim()) {
    errors.push({ field: 'color', message: 'Màu sắc là bắt buộc' });
  }

  // Type validation
  if (!formData.type) {
    errors.push({ field: 'type', message: 'Loại xe là bắt buộc' });
  }

  // Battery capacity validation
  if (!formData.batteryCapacity || formData.batteryCapacity === '') {
    errors.push({ field: 'batteryCapacity', message: 'Dung lượng pin là bắt buộc' });
  } else {
    const batteryStr = String(formData.batteryCapacity).trim();
    const batteryCapacity = parseFloat(batteryStr);
    if (!batteryStr || isNaN(batteryCapacity) || batteryCapacity < 1 || batteryCapacity > 10) {
      errors.push({ field: 'batteryCapacity', message: 'Dung lượng pin phải từ 1 đến 10 kWh' });
    }
  }

  // Max range validation
  if (!formData.maxRange || formData.maxRange === '') {
    errors.push({ field: 'maxRange', message: 'Quãng đường tối đa là bắt buộc' });
  } else {
    const rangeStr = String(formData.maxRange).trim();
    const maxRange = parseInt(rangeStr, 10);
    if (!rangeStr || isNaN(maxRange) || maxRange < 50 || maxRange > 200) {
      errors.push({ field: 'maxRange', message: 'Quãng đường tối đa phải từ 50 đến 200 km' });
    }
  }

  // Price per day validation
  if (!formData.pricePerDay || formData.pricePerDay === '') {
    errors.push({ field: 'pricePerDay', message: 'Giá thuê là bắt buộc' });
  } else {
    const priceStr = String(formData.pricePerDay).replace(/\./g, '').trim();
    const pricePerDay = parseInt(priceStr, 10);
    if (!priceStr || isNaN(pricePerDay) || pricePerDay < 50000 || pricePerDay > 500000) {
      errors.push({ field: 'pricePerDay', message: 'Giá thuê phải từ 50,000 đến 500,000 VNĐ' });
    }
  }

  // Deposit percentage validation
  if (!formData.depositPercentage || formData.depositPercentage === '') {
    errors.push({ field: 'depositPercentage', message: 'Phần trăm cọc là bắt buộc' });
  } else {
    const depositStr = String(formData.depositPercentage).trim();
    const depositPercentage = parseInt(depositStr, 10);
    if (!depositStr || isNaN(depositPercentage) || depositPercentage < 10 || depositPercentage > 100) {
      errors.push({ field: 'depositPercentage', message: 'Phần trăm cọc phải từ 10 đến 100%' });
    }
  }

  // Quantity validation
  if (!formData.quantity || formData.quantity === '') {
    errors.push({ field: 'quantity', message: 'Số lượng xe là bắt buộc' });
  } else {
    const quantityStr = String(formData.quantity).trim();
    const quantity = parseInt(quantityStr, 10);
    if (!quantityStr || isNaN(quantity) || quantity <= 0 || quantity > 100) {
      errors.push({ field: 'quantity', message: 'Số lượng xe phải từ 1 đến 100' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Scroll to first error field
 */
export function scrollToFirstError(errors: ValidationError[]): void {
  if (errors.length === 0) return;

  const firstError = errors[0];
  setTimeout(() => {
    const errorElement = document.getElementById(`field-${firstError.field}`) ||
                        document.querySelector(`[name="${firstError.field}"]`);
    
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (errorElement as HTMLElement).focus();
    } else {
      // Fallback: scroll to first error message
      const firstErrorMsg = document.querySelector('.text-red-500');
      if (firstErrorMsg) {
        firstErrorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, 100);
}

/**
 * Convert validation errors to Record format for form state
 */
export function errorsToRecord(errors: ValidationError[]): Record<string, string> {
  const record: Record<string, string> = {};
  errors.forEach(error => {
    record[error.field] = error.message;
  });
  return record;
}

