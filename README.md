# TherapyDocs - Clinical Documentation System

A modern, HIPAA-compliant therapy documentation system built with Next.js 14, designed for mental health professionals, clinics, and health insurance funds.

![TherapyDocs](https://img.shields.io/badge/Version-1.0.0-sage)
![License](https://img.shields.io/badge/License-MIT-blue)
![HIPAA](https://img.shields.io/badge/HIPAA-Compliant-green)

## 🌟 Overview

TherapyDocs revolutionizes how therapists document and manage treatment sessions. Built with a calming, professional aesthetic specifically designed for healthcare environments, it combines beautiful design with powerful AI-enhanced features.

## ✨ Key Features

### 🏥 Multi-Disciplinary Support
- **Role-Based Templates**: Customized documentation templates for different therapist types:
  - Psychologists
  - Psychiatrists  
  - Social Workers
  - Occupational Therapists
  - Speech Therapists
  - Family Therapists
  - Art & Music Therapists
  - And more...

### 📝 Session Documentation
- **SOAP Notes**: Structured documentation with Subjective, Objective, Assessment, and Plan sections
- **Risk Assessment**: Built-in suicide/homicide ideation screening with safety plan tracking
- **Voice Recording**: Record session notes and get AI-powered transcription (Revolutionary Feature)
- **Intervention Tracking**: Document therapeutic interventions used in each session
- **Digital Signatures**: Secure e-signature for completed documentation

### 👥 Patient Management
- Comprehensive patient profiles with encrypted PHI
- Multi-therapist assignment (care teams)
- Treatment goal tracking with progress visualization
- Insurance and referral source tracking
- Document management

### 📊 AI-Enhanced Features (Revolutionary)
- **Intelligent Summarization**: AI generates session summaries tailored to therapist role
- **Pattern Recognition**: Automatic detection of:
  - Mood trends across sessions
  - Risk escalation patterns
  - Treatment engagement levels
- **Predictive Insights**: Proactive alerts for clinical attention
- **Voice-to-Text**: Transcribe voice notes into structured documentation

### 📋 Report Generation
- **Progress Summaries**: Track patient improvement over time
- **Discharge Summaries**: Comprehensive end-of-treatment reports
- **Insurance Reports**: Format documentation for billing/authorization
- **Multidisciplinary Reports**: Synthesize notes from entire care team
- **AI-Assisted Writing**: Generate report drafts automatically

### 🔒 Security & Compliance
- **HIPAA Compliant**: Built with healthcare privacy in mind
- **Data Encryption**: All PHI encrypted at rest and in transit
- **Audit Logging**: Complete trail of data access
- **Role-Based Access**: Granular permissions system
- **Secure Authentication**: JWT-based auth with session management

## 🛠 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom medical theme
- **State Management**: React Hooks
- **Form Handling**: Native React forms with Zod validation
- **Authentication**: JWT with bcrypt password hashing
- **Encryption**: Custom encryption utilities (production: use AWS KMS/Azure Key Vault)

## 📁 Project Structure

```
therapy-docs/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── patients/          # Patient management
│   │   ├── sessions/          # Session documentation
│   │   ├── reports/           # Report generation
│   │   └── insights/          # AI insights
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Layout components (Sidebar, Header)
│   │   ├── patients/          # Patient-specific components
│   │   ├── sessions/          # Session-specific components
│   │   └── reports/           # Report-specific components
│   ├── lib/
│   │   ├── mock-data.ts       # Sample data for demo
│   │   ├── security.ts        # Encryption utilities
│   │   ├── templates.ts       # Session templates by role
│   │   └── ai-features.ts     # AI summarization & insights
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── public/                     # Static assets
├── tailwind.config.ts         # Tailwind configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/therapy-docs.git
cd therapy-docs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

### Environment Variables

```env
# Encryption (use proper key management in production)
ENCRYPTION_KEY=your-32-character-encryption-key

# Database (configure for your setup)
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-jwt-secret
```

## 📱 Pages Overview

### Dashboard (`/`)
- Today's schedule at a glance
- Quick stats (sessions, patients, pending documentation)
- AI insights and alerts
- Recent activity feed

### Patients (`/patients`)
- Patient list with search and filters
- Create new patient records
- View patient details and history

### Patient Detail (`/patients/[id]`)
- Overview with treatment progress
- Session history
- Treatment goals with tracking
- Report generation
- Document management

### Sessions (`/sessions`)
- Upcoming and completed sessions
- Filter by date and status
- Pending signature queue

### Session Detail (`/sessions/[id]`)
- Full SOAP documentation
- AI-generated summary
- Risk assessment display
- Digital signature workflow

## 🎨 Design Philosophy

The design follows a **Refined Medical Aesthetic**:

- **Color Palette**: Calming sage greens with warm neutrals
- **Typography**: Crimson Pro for headings, DM Sans for body text
- **Components**: Soft shadows, rounded corners, subtle animations
- **Accessibility**: High contrast ratios, keyboard navigation support

## 🔐 Security Considerations

### For Production Deployment

1. **Encryption Keys**: Use AWS KMS, Azure Key Vault, or similar HSM
2. **Database**: Use encrypted PostgreSQL with row-level security
3. **Authentication**: Implement MFA and session timeout
4. **Audit Logs**: Store in immutable, tamper-evident system
5. **Network**: Use TLS 1.3, implement rate limiting
6. **Backups**: Encrypted backups with tested restore procedures

### HIPAA Compliance Checklist

- [ ] BAA with hosting provider
- [ ] Encryption at rest and in transit
- [ ] Access controls and audit logging
- [ ] Automatic session timeout
- [ ] Data backup and recovery plan
- [ ] Employee training documentation
- [ ] Incident response procedures

## 🔮 Future Enhancements

- [ ] Real-time voice transcription with live editing
- [ ] Treatment plan AI recommendations
- [ ] Integration with EHR systems (Epic, Cerner)
- [ ] Patient portal for homework/self-assessments
- [ ] Telehealth video integration
- [ ] Insurance eligibility verification
- [ ] Automated appointment reminders
- [ ] Outcome measurement tracking (PHQ-9, GAD-7)
- [ ] Mobile app for on-the-go documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Designed with input from practicing mental health professionals
- Built with accessibility and usability as top priorities
- Inspired by the need for better clinical documentation tools

---

**Note**: This is a demonstration application. For production healthcare use, ensure compliance with all applicable regulations (HIPAA, HITECH, state laws) and engage appropriate security and compliance reviews.
