// Shared authorization helpers for resource routes.
//
// Authentication is already enforced globally by src/proxy.ts. These helpers
// add per-record authorization: a therapist may only access resources tied to
// patients they are assigned to; admins may access everything.

import { NextResponse } from 'next/server';
import { getSession, isAdmin, type SessionPayload } from './session';
import { patientRepository } from '@/lib/data/repositories';

export { getSession, isAdmin, type SessionPayload };

export const unauthorized = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export const forbidden = () =>
  NextResponse.json({ error: 'Forbidden' }, { status: 403 });

export const notFound = (message = 'Not found') =>
  NextResponse.json({ error: message }, { status: 404 });

// True when the session may access records belonging to the given patient.
export async function canAccessPatient(
  session: SessionPayload,
  patientId: string
): Promise<boolean> {
  if (isAdmin(session)) return true;
  const patient = await patientRepository.findById(patientId);
  if (!patient) return false;
  return patient.assignedTherapists.includes(session.sub);
}

// The set of patient ids the session is allowed to see (all, for admins).
export async function accessiblePatientIds(
  session: SessionPayload
): Promise<Set<string> | null> {
  if (isAdmin(session)) return null; // null => unrestricted
  const patients = await patientRepository.findByTherapist(session.sub);
  return new Set(patients.map((p) => p.id));
}

// Filter a list of patient-scoped records down to those the session may see.
export async function filterByPatientAccess<T extends { patientId: string }>(
  session: SessionPayload,
  items: T[]
): Promise<T[]> {
  const allowed = await accessiblePatientIds(session);
  if (allowed === null) return items;
  return items.filter((item) => allowed.has(item.patientId));
}
