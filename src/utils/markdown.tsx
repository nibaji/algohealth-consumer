import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { theme, Fonts } from '@/constants/theme';
import { Typography } from '@/components/ui/Typography';

const styles = StyleSheet.create({
  textUser: {
    color: theme.colors.primary.content,
    lineHeight: theme.lineHeight.md,
  },
  textBot: {
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeight.md,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    paddingLeft: theme.spacing.xs,
    marginVertical: 1.5,
  },
  bulletIndicator: {
    fontSize: theme.fontSize.md,
    lineHeight: theme.lineHeight.md,
    fontWeight: '700',
    minWidth: 14,
    textAlign: 'right',
  },
  listItemContent: {
    flex: 1,
    fontSize: theme.fontSize.md,
    lineHeight: theme.lineHeight.md,
  },
  paragraphSpacer: {
    height: theme.spacing.xs,
  },
});

export const renderFormattedText = (text: string, isUser: boolean): React.JSX.Element[] => {
  if (!text) return [];

  // Split text by lines
  const lines = text.split('\n');
  
  // Style references
  const textColor = isUser ? theme.colors.primary.content : theme.colors.text.primary;
  const secondaryColor = isUser ? theme.colors.translucent.white70 : theme.colors.text.secondary;
  
  const inlineStyles = {
    bold: {
      fontWeight: '700' as const,
      color: textColor,
    },
    italic: {
      fontStyle: 'italic' as const,
      color: textColor,
    },
    boldItalic: {
      fontWeight: '700' as const,
      fontStyle: 'italic' as const,
      color: textColor,
    },
    code: {
      fontFamily: process.env.EXPO_OS === 'ios' ? 'Courier' : 'monospace',
      backgroundColor: isUser ? theme.colors.translucent.white15 : theme.colors.background.default,
      color: isUser ? theme.colors.primary.content : theme.colors.text.primary,
      paddingHorizontal: 4,
      borderRadius: theme.radius.sm,
    },
    plain: {
      color: textColor,
    }
  };

  // Helper to parse inline bold/italic/code markers
  const parseInline = (chunk: string, keyPrefix: string): React.JSX.Element[] => {
    // Splits by ***text***, **text**, *text*, or `text`
    const regex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const tokens = chunk.split(regex);

    return tokens.map((token, index) => {
      const key = `${keyPrefix}-${index}`;
      
      if (token.startsWith('***') && token.endsWith('***') && token.length > 6) {
        return (
          <Text key={key} style={inlineStyles.boldItalic}>
            {token.slice(3, -3)}
          </Text>
        );
      }
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        return (
          <Text key={key} style={inlineStyles.bold}>
            {token.slice(2, -2)}
          </Text>
        );
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        return (
          <Text key={key} style={inlineStyles.italic}>
            {token.slice(1, -1)}
          </Text>
        );
      }
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return (
          <Text key={key} style={inlineStyles.code}>
            {token.slice(1, -1)}
          </Text>
        );
      }
      return <Text key={key} style={inlineStyles.plain}>{token}</Text>;
    });
  };

  const renderedBlocks: React.JSX.Element[] = [];

  lines.forEach((line, lineIdx) => {
    const key = `line-${lineIdx}`;
    
    // Check if line is empty (consecutive newlines)
    if (line.trim() === '') {
      renderedBlocks.push(
        <View key={key} style={styles.paragraphSpacer} />
      );
      return;
    }

    // Check for headers (H1 to H6)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      
      let headerFontSize = theme.fontSize.md;
      if (level === 1) headerFontSize = theme.fontSize['2xl'];
      else if (level === 2) headerFontSize = theme.fontSize.xl;
      else if (level === 3) headerFontSize = theme.fontSize.lg;

      renderedBlocks.push(
        <Text
          key={key}
          style={{
            fontFamily: Fonts.sans,
            fontSize: headerFontSize,
            fontWeight: '700',
            color: textColor,
            marginTop: theme.spacing.sm,
            marginBottom: theme.spacing.xs,
            lineHeight: headerFontSize * 1.3,
          }}
        >
          {parseInline(content, `h-${lineIdx}`)}
        </Text>
      );
      return;
    }

    // Check for bullet list item
    const bulletMatch = line.match(/^(\s*[-*•])\s+(.+)$/);
    if (bulletMatch) {
      const content = bulletMatch[2];
      renderedBlocks.push(
        <View key={key} style={styles.listItemRow}>
          <Text style={[styles.bulletIndicator, { color: secondaryColor }]}>•</Text>
          <Text style={[styles.listItemContent, { color: textColor }]}>
            {parseInline(content, `bullet-${lineIdx}`)}
          </Text>
        </View>
      );
      return;
    }

    // Check for numbered list item
    const numberMatch = line.match(/^(\s*\d+)\.\s+(.+)$/);
    if (numberMatch) {
      const numPrefix = numberMatch[1].trim();
      const content = numberMatch[2];
      renderedBlocks.push(
        <View key={key} style={styles.listItemRow}>
          <Text style={[styles.bulletIndicator, { color: secondaryColor, fontVariant: ['tabular-nums'] }]}>
            {numPrefix}.
          </Text>
          <Text style={[styles.listItemContent, { color: textColor }]}>
            {parseInline(content, `number-${lineIdx}`)}
          </Text>
        </View>
      );
      return;
    }

    // Default text paragraph
    renderedBlocks.push(
      <Typography.Paragraph
        key={key}
        style={isUser ? styles.textUser : styles.textBot}
      >
        {parseInline(line, `p-${lineIdx}`)}
      </Typography.Paragraph>
    );
  });

  return renderedBlocks;
};
