'use client';

import React from 'react';
import Link from 'next/link';
import { Patient, User, TherapistRole } from '@/types';
import { Card, Badge, Avatar, ProgressBar } from '@/components/ui';
import { therapistRoleLabels } from '@/lib/mock-data';

interface PatientListProps {
  patients: Patient[];
  therapists: User[];
}

export function PatientList({ patients, therapists }: PatientListProps) {
  const getTherapist = (id: string) => therapists.find(t => t.id === id);

  const getStatusBadge = (status: Patient['status']) => {
    const variants: Record<Patient['status'], 'success' | 'warning' | 'sage'> = {
      active: 'success',
      inactive: 'warning',
      discharged: 'sage',
    };
    const labels: Record<Patient['status'], string> = {
      active: 'פעיל',
      inactive: 'לא פעיל',
      discharged: 'שוחרר',
    };
    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {patients.map((patient, index) => (
        <Link key={patient.id} href={`/patients/${patient.id}`}>
          <Card 
            hover 
            padding="none" 
            className="animate-in opacity-0"
            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
          >
            <div className="p-4 flex items-center gap-4">
              {/* Patient Avatar */}
              <div className="relative">
                <Avatar name={patient.patientCode} size="lg" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  patient.status === 'active' ? 'bg-green-500' : 
                  patient.status === 'inactive' ? 'bg-amber-500' : 'bg-clinical-400'
                }`} />
              </div>

              {/* Patient Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-clinical-900">{patient.patientCode}</h3>
                  {getStatusBadge(patient.status)}
                </div>
                <p className="text-sm text-clinical-600 truncate">
                  {patient.primaryDiagnosis || 'אין אבחנה רשומה'}
                </p>
                <p className="text-xs text-clinical-400 mt-1">
                  {patient.insuranceProvider || 'ללא ביטוח'} • הופנה ע&quot;י {patient.referralSource || 'לא ידוע'}
                </p>
              </div>

              {/* Assigned Therapists */}
              <div className="hidden lg:flex items-center -space-x-2">
                {patient.assignedTherapists.slice(0, 3).map(therapistId => {
                  const therapist = getTherapist(therapistId);
                  if (!therapist) return null;
                  return (
                    <div
                      key={therapistId}
                      className="w-8 h-8 rounded-full bg-sage-200 text-sage-700 text-xs font-medium flex items-center justify-center border-2 border-white"
                      title={`${therapist.name} (${therapistRoleLabels[therapist.therapistRole as TherapistRole]})`}
                    >
                      {therapist.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  );
                })}
                {patient.assignedTherapists.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-clinical-200 text-clinical-600 text-xs font-medium flex items-center justify-center border-2 border-white">
                    +{patient.assignedTherapists.length - 3}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <svg className="w-5 h-5 text-clinical-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// Compact patient card for dashboard
interface PatientCardCompactProps {
  patient: Patient;
  lastSession?: Date;
  nextSession?: Date;
  progress?: number;
}

export function PatientCardCompact({ patient, lastSession, nextSession, progress }: PatientCardCompactProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const statusLabels: Record<Patient['status'], string> = {
    active: 'פעיל',
    inactive: 'לא פעיל',
    discharged: 'שוחרר',
  };

  return (
    <Link href={`/patients/${patient.id}`}>
      <Card hover padding="sm" className="h-full">
        <div className="flex items-start justify-between mb-3">
          <Avatar name={patient.patientCode} size="sm" />
          <Badge variant={patient.status === 'active' ? 'success' : 'sage'} className="text-[10px]">
            {statusLabels[patient.status]}
          </Badge>
        </div>

        <h4 className="font-medium text-clinical-900 text-sm mb-1">{patient.patientCode}</h4>
        <p className="text-xs text-clinical-500 line-clamp-1 mb-3">{patient.primaryDiagnosis}</p>

        {progress !== undefined && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-clinical-500 mb-1">
              <span>התקדמות בטיפול</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-clinical-400">
          {lastSession && (
            <span>אחרון: {formatDate(lastSession)}</span>
          )}
          {nextSession && (
            <span className="text-sage-600 font-medium">הבא: {formatDate(nextSession)}</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
