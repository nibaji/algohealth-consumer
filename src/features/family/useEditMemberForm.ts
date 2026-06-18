import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { FamilyMemberOut, FamilyMemberUpdate } from '@/src/features/family/familyTypes';
import { familyService } from '@/src/services/family/familyService';
import { apiDateToInputDate, inputDateToApiDate, validateDateString } from '@/src/utils/date';
import { useAuth } from '@/src/contexts/AuthContext';

type GenderType = 'Male' | 'Female' | 'Other' | 'Unknown';
type RelationType = 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Grandparent' | 'Other';

interface UseEditMemberFormParams {
  visible: boolean;
  member: FamilyMemberOut | null;
  ownerId: string | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export const useEditMemberForm = ({
  visible,
  member,
  ownerId,
  onClose,
  onUpdateSuccess,
}: UseEditMemberFormParams) => {
  const { user } = useAuth();

  const isOwner = !!(user && ownerId && user.id === ownerId);
  const isSelf = !!(user && member && member.user_id && member.user_id === user.id);
  const canDelete = isOwner || isSelf;

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState<RelationType>('Spouse');
  const [memberGender, setMemberGender] = useState<GenderType>('Female');
  const [memberDob, setMemberDob] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMobile, setMemberMobile] = useState('');
  const [customRelation, setCustomRelation] = useState('');
  const [isFamilyHead, setIsFamilyHead] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    dob?: string;
    email?: string;
    mobile?: string;
  }>({});

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!visible || !member) return;
      setError(null);
      setLoadingDetails(true);
      setErrors({});
      setCustomRelation('');
      setIsFamilyHead((member?.relation || '').toLowerCase() === 'self');

      try {
        const fullDetails = await familyService.getFamilyMember(member.id);
        setMemberName(fullDetails.name);
        setIsFamilyHead((fullDetails.relation || '').toLowerCase() === 'self');

        const relationVal = fullDetails.relation;
        const standardRelations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent'];
        if (standardRelations.includes(relationVal)) {
          setMemberRelation(relationVal as RelationType);
          setCustomRelation('');
        } else {
          setMemberRelation('Other');
          setCustomRelation(relationVal);
        }

        setMemberGender((fullDetails.gender || 'Unknown') as GenderType);
        setMemberDob(apiDateToInputDate(fullDetails.date_of_birth));
        setMemberEmail(fullDetails.email_id || '');
        setMemberMobile(fullDetails.mobile_no || '');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load member details');
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchMemberDetails();
  }, [visible, member]);

  const validateField = useCallback((field: 'name' | 'dob' | 'email' | 'mobile', value: string) => {
    let errorMsg = '';
    if (field === 'name') {
      if (!value.trim()) errorMsg = 'Full name is required';
    } else if (field === 'dob') {
      const dobError = validateDateString(value, { label: 'Date of birth' });
      if (dobError) errorMsg = dobError;
    } else if (field === 'email') {
      if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        errorMsg = 'Please enter a valid email address';
      }
    } else if (field === 'mobile') {
      if (value.trim() && !/^\+?[0-9]{7,15}$/.test(value.trim())) {
        errorMsg = 'Please enter a valid mobile number (7 to 15 digits)';
      }
    }

    setErrors(prev => ({ ...prev, [field]: errorMsg ? errorMsg : undefined }));
    return !errorMsg;
  }, []);

  const handleUpdateMember = useCallback(async () => {
    if (!member) return;

    const nameVal = validateField('name', memberName);
    const dobVal = validateField('dob', memberDob);
    const emailVal = validateField('email', memberEmail);
    const mobVal = validateField('mobile', memberMobile);

    if (!nameVal || !dobVal || !emailVal || !mobVal) {
      setError('Please correct the validation errors in the form');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const payload: FamilyMemberUpdate = {
        name: memberName,
        relation: isFamilyHead ? (member?.relation || 'Self') : (memberRelation === 'Other' && customRelation.trim() ? customRelation.trim() : memberRelation),
        gender: memberGender,
        date_of_birth: inputDateToApiDate(memberDob),
        email_id: memberEmail.trim() ? memberEmail : null,
        mobile_no: memberMobile.trim() ? memberMobile : null,
      };

      await familyService.updateFamilyMember(member.id, payload);
      onUpdateSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update member');
    } finally {
      setSaving(false);
    }
  }, [member, memberName, memberRelation, memberGender, memberDob, memberEmail, memberMobile, customRelation, isFamilyHead, onUpdateSuccess, onClose, validateField]);

  const handleDeleteMember = useCallback(() => {
    if (!member) return;

    const performDelete = async () => {
      setError(null);
      setDeleting(true);
      try {
        await familyService.deleteFamilyMember(member.id);
        onUpdateSuccess();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to delete member');
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete ${member.name}? All of their medical records will be deleted permanently. This action cannot be undone.`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Family Member',
        `Are you sure you want to delete ${member.name}? All of their medical records will be deleted permanently. This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  }, [member, onUpdateSuccess, onClose]);

  return {
    memberName, setMemberName,
    memberRelation, setMemberRelation,
    memberGender, setMemberGender,
    memberDob, setMemberDob,
    memberEmail, setMemberEmail,
    memberMobile, setMemberMobile,
    customRelation, setCustomRelation,
    isFamilyHead,
    errors,
    loadingDetails,
    saving,
    deleting,
    error, setError,
    canDelete,
    validateField,
    handleUpdateMember,
    handleDeleteMember,
  };
};
