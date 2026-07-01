-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('COMPANY_ADMIN', 'RECRUITER', 'EVALUATOR', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('MICRO', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "CriteriaDimension" AS ENUM ('TECHNICAL_SKILLS', 'EXPERIENCE', 'EDUCATION', 'LANGUAGES', 'CERTIFICATIONS', 'LOCATION', 'SOFT_SKILLS', 'EVALUATIONS');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('MANUAL', 'UPLOAD', 'LINKEDIN', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "IACCategory" AS ENUM ('EXCELLENT', 'GOOD', 'PARTIAL', 'NOT_RECOMMENDED');

-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('TECHNICAL', 'SOFT');

-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('REMOTE', 'ONSITE', 'PHONE');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "HiringOutcome" AS ENUM ('SELECTED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sector" TEXT,
    "size" "CompanySize",
    "country" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'RECRUITER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'RECRUITER',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "objective" TEXT,
    "functions" TEXT[],
    "responsibilities" TEXT[],
    "education" TEXT,
    "experience" TEXT,
    "experienceYears" INTEGER,
    "technicalSkills" TEXT[],
    "softSkills" TEXT[],
    "languages" TEXT[],
    "certifications" TEXT[],
    "location" TEXT,
    "workMode" "WorkMode",
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCriteria" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "dimension" "CriteriaDimension" NOT NULL,
    "weight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" "CandidateSource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateApplication" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeFile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "ResumeStatus" NOT NULL DEFAULT 'UPLOADED',
    "extractedText" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardizedResume" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "resumeFileId" TEXT,
    "summary" TEXT,
    "yearsExperience" INTEGER,
    "technicalSkills" TEXT[],
    "softSkills" TEXT[],
    "languages" JSONB,
    "certifications" TEXT[],
    "educationLevel" TEXT,
    "degrees" TEXT[],
    "positions" JSONB,
    "locationCity" TEXT,
    "locationCountry" TEXT,
    "raw" JSONB,
    "parserName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandardizedResume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IACScore" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "category" "IACCategory" NOT NULL,
    "explanation" TEXT NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "risks" TEXT[],
    "engineVersion" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IACScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IACScoreDetail" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "dimension" "CriteriaDimension" NOT NULL,
    "weight" INTEGER NOT NULL,
    "rawScore" INTEGER NOT NULL,
    "applicable" BOOLEAN NOT NULL,
    "note" TEXT,

    CONSTRAINT "IACScoreDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiddenCandidateData" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "resumeFileId" TEXT,
    "fullName" TEXT,
    "hasPhoto" BOOLEAN NOT NULL DEFAULT false,
    "age" INTEGER,
    "gender" TEXT,
    "institutions" TEXT[],
    "specificAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiddenCandidateData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EvaluationType" NOT NULL,
    "description" TEXT,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEvaluation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationResult" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "applicationId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "normalizedScore" INTEGER NOT NULL,
    "notes" TEXT,
    "evaluatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "mode" "InterviewMode" NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "notes" TEXT,
    "interviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringDecision" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "decision" "HiringOutcome" NOT NULL,
    "reason" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiringDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_slug_idx" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_deletedAt_idx" ON "Company"("deletedAt");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_idx" ON "CompanyMember"("companyId");

-- CreateIndex
CREATE INDEX "CompanyMember_userId_idx" ON "CompanyMember"("userId");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_role_idx" ON "CompanyMember"("companyId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_userId_companyId_key" ON "CompanyMember"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_companyId_idx" ON "Invitation"("companyId");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_companyId_email_status_key" ON "Invitation"("companyId", "email", "status");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Job_companyId_status_idx" ON "Job"("companyId", "status");

-- CreateIndex
CREATE INDEX "Job_deletedAt_idx" ON "Job"("deletedAt");

-- CreateIndex
CREATE INDEX "JobCriteria_jobId_idx" ON "JobCriteria"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "JobCriteria_jobId_dimension_key" ON "JobCriteria"("jobId", "dimension");

-- CreateIndex
CREATE INDEX "Candidate_companyId_idx" ON "Candidate"("companyId");

-- CreateIndex
CREATE INDEX "Candidate_companyId_email_idx" ON "Candidate"("companyId", "email");

-- CreateIndex
CREATE INDEX "Candidate_deletedAt_idx" ON "Candidate"("deletedAt");

-- CreateIndex
CREATE INDEX "CandidateApplication_companyId_idx" ON "CandidateApplication"("companyId");

-- CreateIndex
CREATE INDEX "CandidateApplication_jobId_status_idx" ON "CandidateApplication"("jobId", "status");

-- CreateIndex
CREATE INDEX "CandidateApplication_candidateId_idx" ON "CandidateApplication"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateApplication_candidateId_jobId_key" ON "CandidateApplication"("candidateId", "jobId");

-- CreateIndex
CREATE INDEX "ResumeFile_companyId_idx" ON "ResumeFile"("companyId");

-- CreateIndex
CREATE INDEX "ResumeFile_candidateId_idx" ON "ResumeFile"("candidateId");

-- CreateIndex
CREATE INDEX "ResumeFile_status_idx" ON "ResumeFile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StandardizedResume_candidateId_key" ON "StandardizedResume"("candidateId");

-- CreateIndex
CREATE INDEX "StandardizedResume_companyId_idx" ON "StandardizedResume"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IACScore_applicationId_key" ON "IACScore"("applicationId");

-- CreateIndex
CREATE INDEX "IACScore_companyId_idx" ON "IACScore"("companyId");

-- CreateIndex
CREATE INDEX "IACScore_jobId_overall_idx" ON "IACScore"("jobId", "overall");

-- CreateIndex
CREATE INDEX "IACScoreDetail_scoreId_idx" ON "IACScoreDetail"("scoreId");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenCandidateData_candidateId_key" ON "HiddenCandidateData"("candidateId");

-- CreateIndex
CREATE INDEX "HiddenCandidateData_companyId_idx" ON "HiddenCandidateData"("companyId");

-- CreateIndex
CREATE INDEX "Evaluation_companyId_idx" ON "Evaluation"("companyId");

-- CreateIndex
CREATE INDEX "Evaluation_deletedAt_idx" ON "Evaluation"("deletedAt");

-- CreateIndex
CREATE INDEX "JobEvaluation_companyId_idx" ON "JobEvaluation"("companyId");

-- CreateIndex
CREATE INDEX "JobEvaluation_jobId_idx" ON "JobEvaluation"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "JobEvaluation_jobId_evaluationId_key" ON "JobEvaluation"("jobId", "evaluationId");

-- CreateIndex
CREATE INDEX "EvaluationResult_companyId_idx" ON "EvaluationResult"("companyId");

-- CreateIndex
CREATE INDEX "EvaluationResult_candidateId_idx" ON "EvaluationResult"("candidateId");

-- CreateIndex
CREATE INDEX "EvaluationResult_evaluationId_idx" ON "EvaluationResult"("evaluationId");

-- CreateIndex
CREATE INDEX "Interview_companyId_idx" ON "Interview"("companyId");

-- CreateIndex
CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

-- CreateIndex
CREATE INDEX "Interview_scheduledAt_idx" ON "Interview"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "HiringDecision_applicationId_key" ON "HiringDecision"("applicationId");

-- CreateIndex
CREATE INDEX "HiringDecision_companyId_idx" ON "HiringDecision"("companyId");

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCriteria" ADD CONSTRAINT "JobCriteria_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeFile" ADD CONSTRAINT "ResumeFile_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardizedResume" ADD CONSTRAINT "StandardizedResume_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IACScore" ADD CONSTRAINT "IACScore_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IACScoreDetail" ADD CONSTRAINT "IACScoreDetail_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "IACScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenCandidateData" ADD CONSTRAINT "HiddenCandidateData_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEvaluation" ADD CONSTRAINT "JobEvaluation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEvaluation" ADD CONSTRAINT "JobEvaluation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringDecision" ADD CONSTRAINT "HiringDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
