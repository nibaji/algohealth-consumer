import React from 'react';
import { StyleProp, ViewStyle, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * Centralized SF Symbol → Material Icon mapping.
 * iOS uses SF Symbols natively via SymbolView.
 * Android/Web use MaterialIcons as fallback.
 */
const MATERIAL_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.up': 'expand-less',
  'chevron.down': 'expand-more',
  'person.crop.circle.fill': 'account-circle',
  'person.3.fill': 'group',
  'person.badge.plus': 'person-add',
  'key.fill': 'vpn-key',
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'pencil': 'edit',
  'xmark': 'close',
  'sparkles': 'auto-awesome',
  'checkmark': 'check',
  'checkmark.seal.fill': 'verified',
  'square.and.arrow.up': 'share',
  'doc.on.doc.fill': 'content-copy',
  'trash.fill': 'delete',
  'paperplane.fill': 'send',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'arrow.right.to.line.cycle': 'sync',
  'doc.fill': 'description',
  'waveform': 'keyboard-voice',
  'paperclip': 'attach-file',
  'mic.fill': 'mic',
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
};

type SFSymbolName = keyof typeof MATERIAL_MAP;

interface IconProps {
  name: SFSymbolName;
  size?: number;
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const Icon = ({ name, size = 20, tintColor, style }: IconProps): React.JSX.Element => {
  const materialName = MATERIAL_MAP[name] ?? 'help-outline';

  return (
    <SymbolView
      name={name as SFSymbol}
      size={size}
      tintColor={tintColor}
      style={style}
      fallback={
        <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
          <MaterialIcons
            name={materialName}
            size={size}
            color={tintColor}
          />
        </View>
      }
    />
  );
};
