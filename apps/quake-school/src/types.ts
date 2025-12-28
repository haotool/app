export enum AppState {
  LANDING = 'LANDING',
  LESSON = 'LESSON',
  QUIZ = 'QUIZ',
  REPORT = 'REPORT',
}

export interface LessonContent {
  id: string;
  title: string;
  subtitle: string;
  level: 'preschool' | 'intermediate' | 'factsheet';
  paragraphs: string[];
  tips?: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface IntensityLevel {
  level: string;
  title: string;
  description: string;
  action: string;
  color: string;
}
