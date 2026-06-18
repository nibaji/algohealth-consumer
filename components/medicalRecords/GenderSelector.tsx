import React from 'react';
import { View, Pressable } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { styles } from './editMemberModalStyles';

export type GenderType = 'Male' | 'Female' | 'Other' | 'Unknown';

interface GenderSelectorProps {
  gender: GenderType;
  onChangeGender: (gender: GenderType) => void;
}

export const GenderSelector: React.FC<GenderSelectorProps> = React.memo(({ gender, onChangeGender }) => {
  return (
    <View style={styles.formGroup}>
      <Typography.Label style={styles.selectLabel}>Gender</Typography.Label>
      <View style={styles.chipsRow}>
        {(['Male', 'Female', 'Other'] as GenderType[]).map((genderOption) => {
          const isSelected = gender === genderOption;
          return (
            <Pressable
              key={genderOption}
              onPress={() => onChangeGender(genderOption)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : null,
                { borderCurve: 'continuous' }
              ]}
            >
              <Typography.Label 
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : null
                ]}
                truncate
              >
                {genderOption}
              </Typography.Label>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

GenderSelector.displayName = 'GenderSelector';
