import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { TextInput } from '@/components/ui/TextInput';
import { styles } from './edit-member-modal.styles';

export type RelationType = 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Grandparent' | 'Other';

interface RelationSelectorProps {
  isFamilyHead: boolean;
  relation: RelationType;
  onChangeRelation: (relation: RelationType) => void;
  customRelation: string;
  onChangeCustomRelation: (text: string) => void;
}

export const RelationSelector: React.FC<RelationSelectorProps> = React.memo(({
  isFamilyHead,
  relation,
  onChangeRelation,
  customRelation,
  onChangeCustomRelation,
}) => {
  return (
    <View style={styles.formGroup}>
      <Typography.Label style={styles.selectLabel}>Relationship to Family Head</Typography.Label>
      {isFamilyHead ? (
        <View style={[styles.lockedRelationContainer, { borderCurve: 'continuous' }]}>
          <Typography.Paragraph style={styles.lockedRelationText}>
            Self (Family Head)
          </Typography.Paragraph>
        </View>
      ) : (
        <>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relationsRow}
          >
            {(['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other'] as RelationType[]).map((relationOption) => {
              const isSelected = relation === relationOption;
              return (
                <Pressable
                  key={relationOption}
                  onPress={() => onChangeRelation(relationOption)}
                  style={[
                    styles.relationChip,
                    isSelected ? styles.relationChipSelected : null,
                    { borderCurve: 'continuous' }
                  ]}
                >
                  <Typography.Label 
                    style={[
                      styles.relationChipText,
                      isSelected ? styles.relationChipTextSelected : null
                    ]}
                  >
                    {relationOption}
                  </Typography.Label>
                </Pressable>
              );
            })}
          </ScrollView>

          {relation === 'Other' ? (
            <View style={{ marginTop: 12 }}>
              <TextInput
                label="Custom Relationship (Optional)"
                placeholder="e.g. Cousin, Friend, Caregiver"
                value={customRelation}
                onChangeText={onChangeCustomRelation}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
});

RelationSelector.displayName = 'RelationSelector';
