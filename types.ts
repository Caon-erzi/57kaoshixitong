export interface ExamQuestion {
  questionType: string;
  applicableType: string;
  questionTitle: string;
  fileUrl: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  optionF: string;
  answer: string;
}

export enum ProcessStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface FileInput {
  file: File;
  preview: string;
  type: 'image' | 'text';
}

export interface TypeSetting {
  score: number;
  count: number;
}

export interface ExamConfig {
  judgment: TypeSetting;
  single: TypeSetting;
  multi: TypeSetting;
  short: TypeSetting;
}

export interface WordHeaderConfig {
  mainTitle: string;
  subTitle: string;
  department: string;
}