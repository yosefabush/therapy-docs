import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'TherapyDocs API',
        version: '1.0.0',
        description: 'HIPAA-compliant clinical documentation system API for mental health professionals',
        contact: {
          name: 'TherapyDocs Support',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Patients', description: 'Patient management endpoints' },
        { name: 'Sessions', description: 'Therapy session endpoints' },
        { name: 'Treatment Goals', description: 'Treatment goal endpoints' },
        { name: 'Reports', description: 'Report generation endpoints' },
        { name: 'System', description: 'System management endpoints' },
      ],
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              role: { type: 'string', enum: ['therapist', 'admin', 'supervisor'] },
              therapistRole: {
                type: 'string',
                enum: [
                  'psychologist', 'psychiatrist', 'social_worker',
                  'occupational_therapist', 'speech_therapist', 'physical_therapist',
                  'counselor', 'art_therapist', 'music_therapist', 'family_therapist'
                ],
              },
              licenseNumber: { type: 'string' },
              organization: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              lastLogin: { type: 'string', format: 'date-time' },
            },
          },
          Patient: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              encryptedData: { type: 'string' },
              patientCode: { type: 'string' },
              dateOfBirth: { type: 'string' },
              gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
              primaryDiagnosis: { type: 'string' },
              referralSource: { type: 'string' },
              insuranceProvider: { type: 'string' },
              assignedTherapists: { type: 'array', items: { type: 'string' } },
              status: { type: 'string', enum: ['active', 'inactive', 'discharged'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          PatientCreate: {
            type: 'object',
            required: ['encryptedData', 'patientCode', 'dateOfBirth', 'gender', 'assignedTherapists'],
            properties: {
              encryptedData: { type: 'string' },
              patientCode: { type: 'string' },
              dateOfBirth: { type: 'string' },
              gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
              primaryDiagnosis: { type: 'string' },
              referralSource: { type: 'string' },
              insuranceProvider: { type: 'string' },
              assignedTherapists: { type: 'array', items: { type: 'string' }, minItems: 1 },
              status: { type: 'string', enum: ['active', 'inactive', 'discharged'], default: 'active' },
            },
          },
          Session: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              patientId: { type: 'string' },
              therapistId: { type: 'string' },
              therapistRole: { type: 'string' },
              sessionType: {
                type: 'string',
                enum: [
                  'initial_assessment', 'individual_therapy', 'group_therapy',
                  'family_therapy', 'evaluation', 'follow_up',
                  'crisis_intervention', 'discharge_planning'
                ],
              },
              scheduledAt: { type: 'string', format: 'date-time' },
              duration: { type: 'integer' },
              status: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'] },
              location: { type: 'string', enum: ['in_person', 'telehealth', 'home_visit'] },
              notes: { $ref: '#/components/schemas/SessionNotes' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              signedAt: { type: 'string', format: 'date-time' },
              signedBy: { type: 'string' },
            },
          },
          SessionNotes: {
            type: 'object',
            properties: {
              chiefComplaint: { type: 'string' },
              subjective: { type: 'string' },
              objective: { type: 'string' },
              assessment: { type: 'string' },
              plan: { type: 'string' },
              interventionsUsed: { type: 'array', items: { type: 'string' } },
              progressTowardGoals: { type: 'string' },
              homework: { type: 'string' },
              nextSessionPlan: { type: 'string' },
            },
          },
          SessionCreate: {
            type: 'object',
            required: ['patientId', 'therapistId', 'therapistRole', 'sessionType', 'scheduledAt'],
            properties: {
              patientId: { type: 'string' },
              therapistId: { type: 'string' },
              therapistRole: {
                type: 'string',
                enum: [
                  'psychologist', 'psychiatrist', 'social_worker',
                  'occupational_therapist', 'speech_therapist', 'physical_therapist',
                  'counselor', 'art_therapist', 'music_therapist', 'family_therapist'
                ],
              },
              sessionType: {
                type: 'string',
                enum: [
                  'initial_assessment', 'individual_therapy', 'group_therapy',
                  'family_therapy', 'evaluation', 'follow_up',
                  'crisis_intervention', 'discharge_planning'
                ],
              },
              scheduledAt: { type: 'string', format: 'date-time' },
              duration: { type: 'integer', minimum: 15, maximum: 180, default: 50 },
              status: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
              location: { type: 'string', enum: ['in_person', 'telehealth', 'home_visit'], default: 'in_person' },
              notes: { $ref: '#/components/schemas/SessionNotes' },
            },
          },
          TreatmentGoal: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              patientId: { type: 'string' },
              description: { type: 'string' },
              targetDate: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['active', 'achieved', 'modified', 'discontinued'] },
              progress: { type: 'integer', minimum: 0, maximum: 100 },
              measurementCriteria: { type: 'string' },
              createdBy: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          TreatmentGoalCreate: {
            type: 'object',
            required: ['patientId', 'description', 'measurementCriteria', 'createdBy'],
            properties: {
              patientId: { type: 'string' },
              description: { type: 'string' },
              targetDate: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['active', 'achieved', 'modified', 'discontinued'], default: 'active' },
              progress: { type: 'integer', minimum: 0, maximum: 100, default: 0 },
              measurementCriteria: { type: 'string' },
              createdBy: { type: 'string' },
            },
          },
          Report: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              patientId: { type: 'string' },
              reportType: {
                type: 'string',
                enum: [
                  'progress_summary', 'discharge_summary', 'insurance_report',
                  'referral_report', 'evaluation_report', 'treatment_summary', 'multidisciplinary_summary'
                ],
              },
              generatedBy: { type: 'string' },
              generatedAt: { type: 'string', format: 'date-time' },
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' },
                },
              },
              content: { $ref: '#/components/schemas/ReportContent' },
              status: { type: 'string', enum: ['draft', 'finalized', 'signed'] },
            },
          },
          ReportContent: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              sessionsSummary: { type: 'array', items: { type: 'object' } },
              goalsProgress: { type: 'array', items: { type: 'object' } },
              recommendations: { type: 'string' },
              clinicalImpressions: { type: 'string' },
            },
          },
          ReportCreate: {
            type: 'object',
            required: ['patientId', 'reportType', 'generatedBy', 'dateRange', 'content'],
            properties: {
              patientId: { type: 'string' },
              reportType: {
                type: 'string',
                enum: [
                  'progress_summary', 'discharge_summary', 'insurance_report',
                  'referral_report', 'evaluation_report', 'treatment_summary', 'multidisciplinary_summary'
                ],
              },
              generatedBy: { type: 'string' },
              dateRange: {
                type: 'object',
                required: ['start', 'end'],
                properties: {
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' },
                },
              },
              content: {
                type: 'object',
                required: ['summary'],
                properties: {
                  summary: { type: 'string' },
                  sessionsSummary: { type: 'array', items: { type: 'object' } },
                  goalsProgress: { type: 'array', items: { type: 'object' } },
                  recommendations: { type: 'string' },
                  clinicalImpressions: { type: 'string' },
                },
              },
              status: { type: 'string', enum: ['draft', 'finalized', 'signed'], default: 'draft' },
            },
          },
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
      paths: {
        '/api/seed': {
          post: {
            tags: ['System'],
            summary: 'Seed database',
            description: 'Seeds the database with initial mock data. Use reset=true to reset existing data.',
            parameters: [
              {
                name: 'reset',
                in: 'query',
                schema: { type: 'boolean' },
                description: 'Reset database to initial state',
              },
            ],
            responses: {
              200: {
                description: 'Seeding successful',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/api/users': {
          get: {
            tags: ['Users'],
            summary: 'Get all users',
            description: 'Returns a list of all users in the system',
            responses: {
              200: {
                description: 'List of users',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/api/users/{id}': {
          get: {
            tags: ['Users'],
            summary: 'Get user by ID',
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
              200: {
                description: 'User found',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
              404: { description: 'User not found' },
            },
          },
        },
        '/api/patients': {
          get: {
            tags: ['Patients'],
            summary: 'Get all patients',
            parameters: [
              { name: 'therapistId', in: 'query', schema: { type: 'string' }, description: 'Filter by therapist' },
              { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'discharged'] } },
            ],
            responses: {
              200: {
                description: 'List of patients',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: { type: 'array', items: { $ref: '#/components/schemas/Patient' } },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            tags: ['Patients'],
            summary: 'Create a new patient',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PatientCreate' },
                },
              },
            },
            responses: {
              201: {
                description: 'Patient created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { data: { $ref: '#/components/schemas/Patient' } },
                    },
                  },
                },
              },
              400: { description: 'Validation error' },
            },
          },
        },
        '/api/patients/{id}': {
          get: {
            tags: ['Patients'],
            summary: 'Get patient by ID',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: {
                description: 'Patient found',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Patient' } } },
                  },
                },
              },
              404: { description: 'Patient not found' },
            },
          },
          put: {
            tags: ['Patients'],
            summary: 'Update patient',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/PatientCreate' } } },
            },
            responses: {
              200: { description: 'Patient updated' },
              404: { description: 'Patient not found' },
            },
          },
          delete: {
            tags: ['Patients'],
            summary: 'Delete patient',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Patient deleted' },
              404: { description: 'Patient not found' },
            },
          },
        },
        '/api/patients/{id}/sessions': {
          get: {
            tags: ['Patients'],
            summary: 'Get sessions for a patient',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: {
                description: 'List of sessions',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Session' } } } },
                  },
                },
              },
            },
          },
        },
        '/api/patients/{id}/goals': {
          get: {
            tags: ['Patients'],
            summary: 'Get treatment goals for a patient',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: {
                description: 'List of goals',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/TreatmentGoal' } } } },
                  },
                },
              },
            },
          },
        },
        '/api/patients/{id}/reports': {
          get: {
            tags: ['Patients'],
            summary: 'Get reports for a patient',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: {
                description: 'List of reports',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Report' } } } },
                  },
                },
              },
            },
          },
        },
        '/api/sessions': {
          get: {
            tags: ['Sessions'],
            summary: 'Get all sessions',
            parameters: [
              { name: 'therapistId', in: 'query', schema: { type: 'string' } },
              { name: 'patientId', in: 'query', schema: { type: 'string' } },
            ],
            responses: {
              200: {
                description: 'List of sessions',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Session' } } } },
                  },
                },
              },
            },
          },
          post: {
            tags: ['Sessions'],
            summary: 'Create a new session',
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionCreate' } } },
            },
            responses: {
              201: { description: 'Session created' },
              400: { description: 'Validation error' },
            },
          },
        },
        '/api/sessions/{id}': {
          get: {
            tags: ['Sessions'],
            summary: 'Get session by ID',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Session found' },
              404: { description: 'Session not found' },
            },
          },
          put: {
            tags: ['Sessions'],
            summary: 'Update session',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Session updated' },
              404: { description: 'Session not found' },
            },
          },
          delete: {
            tags: ['Sessions'],
            summary: 'Delete session',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Session deleted' },
              404: { description: 'Session not found' },
            },
          },
        },
        '/api/treatment-goals': {
          get: {
            tags: ['Treatment Goals'],
            summary: 'Get all treatment goals',
            parameters: [{ name: 'patientId', in: 'query', schema: { type: 'string' } }],
            responses: {
              200: {
                description: 'List of goals',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/TreatmentGoal' } } } },
                  },
                },
              },
            },
          },
          post: {
            tags: ['Treatment Goals'],
            summary: 'Create a new treatment goal',
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/TreatmentGoalCreate' } } },
            },
            responses: {
              201: { description: 'Goal created' },
              400: { description: 'Validation error' },
            },
          },
        },
        '/api/treatment-goals/{id}': {
          get: {
            tags: ['Treatment Goals'],
            summary: 'Get goal by ID',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Goal found' },
              404: { description: 'Goal not found' },
            },
          },
          put: {
            tags: ['Treatment Goals'],
            summary: 'Update goal',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Goal updated' },
              404: { description: 'Goal not found' },
            },
          },
          delete: {
            tags: ['Treatment Goals'],
            summary: 'Delete goal',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Goal deleted' },
              404: { description: 'Goal not found' },
            },
          },
        },
        '/api/reports': {
          get: {
            tags: ['Reports'],
            summary: 'Get all reports',
            parameters: [{ name: 'patientId', in: 'query', schema: { type: 'string' } }],
            responses: {
              200: {
                description: 'List of reports',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Report' } } } },
                  },
                },
              },
            },
          },
          post: {
            tags: ['Reports'],
            summary: 'Create a new report',
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ReportCreate' } } },
            },
            responses: {
              201: { description: 'Report created' },
              400: { description: 'Validation error' },
            },
          },
        },
        '/api/reports/{id}': {
          get: {
            tags: ['Reports'],
            summary: 'Get report by ID',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Report found' },
              404: { description: 'Report not found' },
            },
          },
          put: {
            tags: ['Reports'],
            summary: 'Update report',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Report updated' },
              404: { description: 'Report not found' },
            },
          },
          delete: {
            tags: ['Reports'],
            summary: 'Delete report',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: { description: 'Report deleted' },
              404: { description: 'Report not found' },
            },
          },
        },
      },
    },
  });
  return spec;
};
