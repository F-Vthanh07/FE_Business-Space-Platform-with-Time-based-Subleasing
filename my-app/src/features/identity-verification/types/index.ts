export type CccdInputSource = 'upload' | 'webcam';

export type CccdVerificationStatus = 'unverified' | 'pending' | 'verified';

export type CccdScanState = 'idle' | 'requesting-camera' | 'scanning' | 'success' | 'error';

export interface CccdQrData {
  idNumber: string;
  oldIdNumber: string | null;
  fullName: string;
  dateOfBirthRaw: string;
  dateOfBirthIso: string;
  gender: string;
  permanentAddress: string;
  issueDateRaw: string;
  issueDateIso: string;
}

export interface CccdParseError {
  code: 'EMPTY_INPUT' | 'INVALID_FIELD_COUNT' | 'INVALID_FORMAT' | 'INVALID_DATE';
  message: string;
}

export type CccdParseResult =
  | { success: true; data: CccdQrData }
  | { success: false; error: CccdParseError };
