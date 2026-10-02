/**
 * Layer 5: Healthcare Service Navigation & Follow-Up Reminder Generator
 *
 * Maps risk categories and clinical patterns to the appropriate level of healthcare.
 * Provides direct emergency access (112, 108) and generates structured follow-up reminders.
 */

import { CareLevel, CareRecommendation, ExtractedSymptom, FollowUpReminder, PatientDemographics, RiskLevel } from '../types';

export const INDIA_EMERGENCY_NUMBERS = {
  general: '112',
  ambulance: '108',
  medicalHelpline: '104',
  telehealth: '14416', // Tele-MANAS
  womenHelpline: '181',
};

/**
 * Maps the risk level and clinical pattern to the appropriate care recommendation
 */
export function mapCareRecommendation(
  riskLevel: RiskLevel,
  symptoms: ExtractedSymptom[],
  demographics: PatientDemographics
): CareRecommendation {
  const affirmative = symptoms.filter((s) => !s.isNegation);
  const hasChest = affirmative.some((s) => s.bodyArea === 'chest');
  const hasEye = affirmative.some((s) => s.name.toLowerCase().includes('eye') || s.bodyArea === 'head');

  if (riskLevel === 'urgent') {
    return {
      level: 'emergency',
      title: 'Emergency Medical Care (Hospital Emergency / ER)',
      description: 'Your symptoms require urgent physician evaluation. Please call emergency services or go to the nearest emergency department right away.',
      urgencyTimeline: 'Immediately (Do not delay)',
      suggestedSpecialist: hasChest ? 'Emergency Medicine / Interventional Cardiologist' : 'Emergency Department Physician',
      actionItems: [
        'Call 112 (National Emergency) or 108 (Ambulance) right now.',
        'Remain seated or lying down comfortably; avoid physical exertion.',
        'Do not drive yourself to the hospital; await an ambulance or designated driver.',
        'Have your national ID, existing prescriptions, and allergy notes ready.',
      ],
      emergencyNumbers: INDIA_EMERGENCY_NUMBERS,
    };
  }

  if (riskLevel === 'attention') {
    // Determine whether GP clinic or specialist is more appropriate
    const isSpecialistWarranted = demographics.knownConditions.length > 0 || hasChest;
    const specialistType = hasChest
      ? 'Cardiologist or Internal Medicine'
      : demographics.knownConditions.some((c) => c.toLowerCase().includes('diabetes'))
      ? 'Endocrinologist or Primary Care Physician'
      : 'General Practitioner / Internal Medicine Specialist';

    return {
      level: isSpecialistWarranted ? 'gp_clinic' : 'teleconsult',
      title: isSpecialistWarranted ? 'In-Person Clinic / GP Visit Recommended' : 'Teleconsultation or Primary Care Appointment',
      description: 'Your symptoms and health background warrant a professional medical review to prevent complications and start appropriate therapy.',
      urgencyTimeline: 'Within 24 to 48 Hours',
      suggestedSpecialist: specialistType,
      actionItems: [
        'Book an in-person clinic appointment or verified teleconsultation within 24-48 hours.',
        'Record your body temperature or blood pressure twice daily until your visit.',
        'Prepare a list of your current medications and questions for the physician.',
        'If any sudden red flags develop (e.g., breathlessness or chest pain), elevate to emergency immediately.',
      ],
      emergencyNumbers: INDIA_EMERGENCY_NUMBERS,
    };
  }

  // Low Risk: Self-care or Pharmacist review
  return {
    level: 'self_care',
    title: 'Self-Care & Home Monitoring',
    description: 'Your warning signs are currently low risk. Rest, symptom relief, and supportive home care are appropriate while observing your recovery.',
    urgencyTimeline: 'Self-monitor over the next 48 to 72 hours',
    suggestedSpecialist: 'Community Pharmacist or Primary Care Physician if unresolved',
    actionItems: [
      'Ensure adequate hydration (warm water, electrolytes, herbal teas).',
      'Get 7-8 hours of restful sleep and avoid strenuous exercise.',
      'Consult a licensed pharmacist for safe over-the-counter soothing options.',
      'Recheck your symptoms if they do not steadily improve within 48 hours.',
    ],
    emergencyNumbers: INDIA_EMERGENCY_NUMBERS,
  };
}

/**
 * Auto-generates structured follow-up reminders based on assessment outcome
 */
export function generateFollowUpReminders(
  riskLevel: RiskLevel,
  symptoms: ExtractedSymptom[],
  demographics: PatientDemographics,
  assessmentId: string
): FollowUpReminder[] {
  const now = Date.now();
  const reminders: FollowUpReminder[] = [];

  const affirmative = symptoms.filter((s) => !s.isNegation);
  const hasFever = affirmative.some((s) => s.name.toLowerCase().includes('fever') || s.name.toLowerCase().includes('bukhar') || s.name.toLowerCase().includes('jwaram'));
  const hasBPConcern = demographics.knownConditions.some((c) => c.toLowerCase().includes('hyper') || c.toLowerCase().includes('blood pressure'));

  if (riskLevel === 'urgent') {
    // Urgent reminders
    reminders.push({
      id: `rem-urg-1-${now}`,
      assessmentId,
      title: 'Emergency Arrival & Care Confirmation',
      description: 'Confirm you have arrived at the hospital or emergency room and are under physician care.',
      dueDate: new Date(now + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      type: 'custom',
      status: 'pending',
      autoEscalateCaregiver: true,
      escalated: false,
      createdAt: new Date().toISOString(),
    });

    reminders.push({
      id: `rem-urg-2-${now}`,
      assessmentId,
      title: 'Post-Emergency Discharge Review & Vitals',
      description: 'Review discharge instructions, follow-up appointments, and emergency medication changes.',
      dueDate: new Date(now + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      type: 'vitals_check',
      status: 'pending',
      autoEscalateCaregiver: true,
      escalated: false,
      createdAt: new Date().toISOString(),
    });
  } else if (riskLevel === 'attention') {
    // Attention reminders
    reminders.push({
      id: `rem-att-1-${now}`,
      assessmentId,
      title: 'Book GP / Teleconsult Appointment',
      description: 'Schedule a consultation with your primary physician or teleconsultation service within 24 hours.',
      dueDate: new Date(now + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
      type: 'gp_visit',
      status: 'pending',
      autoEscalateCaregiver: true,
      escalated: false,
      createdAt: new Date().toISOString(),
    });

    if (hasFever) {
      reminders.push({
        id: `rem-att-fever-${now}`,
        assessmentId,
        title: 'Check & Log Body Temperature',
        description: 'Take your temperature using a digital thermometer. Note if it is above 100.4°F (38°C).',
        dueDate: new Date(now + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        type: 'vitals_check',
        status: 'pending',
        autoEscalateCaregiver: false,
        escalated: false,
        createdAt: new Date().toISOString(),
      });
    }

    if (hasBPConcern) {
      reminders.push({
        id: `rem-att-bp-${now}`,
        assessmentId,
        title: 'Record Blood Pressure Reading',
        description: 'Sit quietly for 5 minutes and record your systolic and diastolic blood pressure.',
        dueDate: new Date(now + 8 * 60 * 60 * 1000).toISOString(),
        type: 'vitals_check',
        status: 'pending',
        autoEscalateCaregiver: false,
        escalated: false,
        createdAt: new Date().toISOString(),
      });
    }

    reminders.push({
      id: `rem-att-recheck-${now}`,
      assessmentId,
      title: '24-Hour Symptom Progression Check',
      description: 'Re-evaluate your symptoms to ensure they are not worsening or developing new red flags.',
      dueDate: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      type: 'recheck',
      status: 'pending',
      autoEscalateCaregiver: true,
      escalated: false,
      createdAt: new Date().toISOString(),
    });
  } else {
    // Low risk reminders
    reminders.push({
      id: `rem-low-1-${now}`,
      assessmentId,
      title: '48-Hour Recovery Check-in',
      description: 'Recheck your symptoms. If sore throat, cough, or fatigue hasn’t improved, consider a pharmacy or GP consultation.',
      dueDate: new Date(now + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
      type: 'recheck',
      status: 'pending',
      autoEscalateCaregiver: false,
      escalated: false,
      createdAt: new Date().toISOString(),
    });

    reminders.push({
      id: `rem-low-2-${now}`,
      assessmentId,
      title: 'Hydration & Rest Check',
      description: 'Confirm you have had at least 2 liters of fluids today and adequate rest.',
      dueDate: new Date(now + 14 * 60 * 60 * 1000).toISOString(),
      type: 'custom',
      status: 'pending',
      autoEscalateCaregiver: false,
      escalated: false,
      createdAt: new Date().toISOString(),
    });
  }

  return reminders;
}
