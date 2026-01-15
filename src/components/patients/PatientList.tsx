'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Patient, User, TherapistRole } from '@/types';
import { Card, Badge, Avatar, ProgressBar } from '@/components/ui';
import { therapistRoleLabels } from '@/lib/mock-data';

// Hoist static status configs outside component
const STATUS_VARIANTS: Record<Patient['status'], 'success' | 'warning' | 'sage'> = {
  active: 'success',
  inactive: 'warning',
  discharged: 'sage',
};

const STATUS_LABELS: Record<Patient['status'], string> = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  discharged: 'שוחרר',
};

interface PatientListProps {
  patients: Patient[];
  therapists: User[];
}

// Memoized patient item component to prevent re-renders of unchanged items
interface PatientItemProps {
  patient: Patient;
  therapistById: Map<string, User>;
  index: number;
}

const PatientItem = memo(function PatientItem({ patient, therapistById, index }: PatientItemProps) {
  return (
    <Link href={`/patients/${patient.id}`}>
      <Card
        hover
        padding="none"
        className="animate-in opacity-0"
        style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
      >
        <div className="p-4 flex items-center gap-4">
          {/* Patient Avatar */}
          <div className="relative">
            <Avatar name={`${patient.firstName} ${patient.lastName}`} size="lg" />
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              patient.status === 'active' ? 'bg-green-500' :
              patient.status === 'inactive' ? 'bg-amber-500' : 'bg-clinical-400'
            }`} />
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-clinical-900">{patient.firstName} {patient.lastName}</h3>
              <Badge variant={STATUS_VARIANTS[patient.status]}>
                {STATUS_LABELS[patient.status]}
              </Badge>
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
              const therapist = therapistById.get(therapistId);
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
  );
});

export function PatientList({ patients, therapists }: PatientListProps) {
  // Build therapist lookup Map for O(1) access
  const therapistById = useMemo(() =>
    new Map(therapists.map(t => [t.id, t])),
    [therapists]
  );

  return (
    <div className="space-y-3">
      {patients.map((patient, index) => (
        <PatientItem
          key={patient.id}
          patient={patient}
          therapistById={therapistById}
          index={index}
        />
      ))}
    </div>
  );
}

// Hoist date formatter outside component
const compactDateFormatter = new Intl.DateTimeFormat('he-IL', {
  month: 'short',
  day: 'numeric',
});

// Compact patient card for dashboard
interface PatientCardCompactProps {
  patient: Patient;
  lastSession?: Date;
  nextSession?: Date;
  progress?: number;
}

export const PatientCardCompact = memo(function PatientCardCompact({
  patient,
  lastSession,
  nextSession,
  progress
}: PatientCardCompactProps) {
  return (
    <Link href={`/patients/${patient.id}`}>
      <Card hover padding="sm" className="h-full text-center">
        <div className="flex flex-col items-center mb-3">
          <Avatar name={`${patient.firstName} ${patient.lastName}`} size="sm" />
          <Badge variant={patient.status === 'active' ? 'success' : 'sage'} className="text-[10px] mt-2">
            {STATUS_LABELS[patient.status]}
          </Badge>
        </div>

        <h4 className="font-medium text-clinical-900 text-sm mb-1">{patient.firstName} {patient.lastName}</h4>
        <p className="text-xs text-clinical-500 line-clamp-1 mb-3">{patient.primaryDiagnosis}</p>

        {progress !== undefined && (
          <div className="mb-3">
            <div className="flex justify-center gap-2 text-xs text-clinical-500 mb-1">
              <span>התקדמות בטיפול</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        <div className="flex flex-col items-center gap-1 text-xs text-clinical-400">
          {lastSession && (
            <span>אחרון: {compactDateFormatter.format(new Date(lastSession))}</span>
          )}
          {nextSession && (
            <span className="text-sage-600 font-medium">הבא: {compactDateFormatter.format(new Date(nextSession))}</span>
          )}
        </div>
      </Card>
    </Link>
  );
});
