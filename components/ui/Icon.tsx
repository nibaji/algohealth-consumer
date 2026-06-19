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
  'envelope.fill': 'mail',
  'envelope': 'mail-outline',
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
  'info.circle.fill': 'info',
  'exclamationmark.triangle.fill': 'warning',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'exclamationmark.circle.fill': 'error',
};

export enum IconName {
  EnvelopeFill = 'envelope.fill',
  Envelope = 'envelope',
  ChevronLeft = 'chevron.left',
  ChevronRight = 'chevron.right',
  ChevronUp = 'chevron.up',
  ChevronDown = 'chevron.down',
  PersonCropCircleFill = 'person.crop.circle.fill',
  Person3Fill = 'person.3.fill',
  PersonBadgePlus = 'person.badge.plus',
  KeyFill = 'key.fill',
  Plus = 'plus',
  PlusCircleFill = 'plus.circle.fill',
  Pencil = 'pencil',
  Xmark = 'xmark',
  Sparkles = 'sparkles',
  Checkmark = 'checkmark',
  CheckmarkSealFill = 'checkmark.seal.fill',
  SquareAndArrowUp = 'square.and.arrow.up',
  DocOnDocFill = 'doc.on.doc.fill',
  TrashFill = 'trash.fill',
  PaperplaneFill = 'paperplane.fill',
  Eye = 'eye',
  EyeSlash = 'eye.slash',
  ArrowRightToLineCycle = 'arrow.right.to.line.cycle',
  DocFill = 'doc.fill',
  Waveform = 'waveform',
  Paperclip = 'paperclip',
  MicFill = 'mic.fill',
  PlayFill = 'play.fill',
  PauseFill = 'pause.fill',
  InfoCircleFill = 'info.circle.fill',
  ExclamationmarkTriangleFill = 'exclamationmark.triangle.fill',
  CheckmarkCircleFill = 'checkmark.circle.fill',
  XmarkCircleFill = 'xmark.circle.fill',
  ExclamationmarkCircleFill = 'exclamationmark.circle.fill',
}

interface IconProps {
  name: IconName;
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
