export type Role = 'admin' | 'instructor';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: Role;
}

export interface Course {
  _id: string;
  name: string;
  level: string;
  description: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lecture {
  _id: string;
  course: Course;
  instructor?: User;
  date: string;
  startTime: string;
  endTime: string;
  batchName?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  conflict?: Lecture;
}

