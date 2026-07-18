import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';

export interface ConsultMemberFilterOption {
  id: string | null;
  label: string;
}

interface ConsultMemberFilterProps {
  options: ConsultMemberFilterOption[];
  selectedId: string | null;
  onSelect: (memberId: string | null) => void;
}

interface FilterChipProps {
  option: ConsultMemberFilterOption;
  selected: boolean;
  onSelect: (memberId: string | null) => void;
}

const FilterChip = React.memo(({ option, selected, onSelect }: FilterChipProps): React.JSX.Element => {
  const handlePress = useCallback((): void => {
    onSelect(option.id);
  }, [onSelect, option.id]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : null,
        pressed ? styles.chipPressed : null,
      ]}
    >
      <Typography.Label style={selected ? styles.labelSelected : styles.label} truncate>
        {option.label}
      </Typography.Label>
    </Pressable>
  );
});

FilterChip.displayName = 'FilterChip';

export const ConsultMemberFilter = React.memo(({
  options,
  selectedId,
  onSelect,
}: ConsultMemberFilterProps): React.JSX.Element => {
  const renderOption = useCallback(({ item }: { item: ConsultMemberFilterOption }): React.JSX.Element => (
    <FilterChip option={item} selected={item.id === selectedId} onSelect={onSelect} />
  ), [onSelect, selectedId]);

  const keyExtractor = useCallback(
    (item: ConsultMemberFilterOption): string => item.id ?? 'all',
    []
  );

  return (
    <View style={styles.container}>
      <FlashList
        horizontal
        data={options}
        renderItem={renderOption}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={FilterSeparator}
        contentContainerStyle={styles.content}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
});

ConsultMemberFilter.displayName = 'ConsultMemberFilter';

const FilterSeparator = (): React.JSX.Element => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: {
    minHeight: theme.spacing['3xl'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  separator: { width: theme.spacing.sm },
  chip: {
    maxWidth: theme.spacing['10xl'],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.default,
  },
  chipSelected: {
    borderColor: theme.colors.primary.DEFAULT,
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  chipPressed: { opacity: 0.75 },
  label: { color: theme.colors.text.secondary, fontWeight: '600' },
  labelSelected: { color: theme.colors.primary.content, fontWeight: '700' },
});
