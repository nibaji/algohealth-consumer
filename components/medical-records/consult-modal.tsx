import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  Pressable, 
  TextInput, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import { medicalRecordService } from '@/src/services/medical-records/medicalRecordService';

interface ConsultModalProps {
  visible: boolean;
  onClose: () => void;
  member: FamilyMemberOut | null;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ConsultModal: React.FC<ConsultModalProps> = React.memo(({ visible, onClose, member }) => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const flashListRef = useRef<FlashListRef<ChatMessage>>(null);

  // Initialize chat when modal opens
  useEffect(() => {
    if (visible && member) {
      setMessages([
        {
          id: 'welcome',
          text: `Hi! I am Benish AI, your AlgoHealth assistant. I have loaded ${member.name}'s medical circle data. How can I help you today?`,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      setInputText('');
      setIsProcessing(false);
    }
  }, [visible, member]);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    const currentRef = flashListRef.current;
    if (currentRef) {
      setTimeout(() => {
        currentRef.scrollToEnd({ animated: true });
      }, 100);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !member || isProcessing) return;

    const userText = inputText.trim();
    setInputText('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: userText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();
    setIsProcessing(true);

    try {
      const res = await medicalRecordService.askBenish(member.id, userText);
      
      // Defensive parsing to extract response text
      const botText = res.response || res.response_text || res.text || res.answer || "Sorry, I couldn't formulate a response.";
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: botText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error communicating with assistant';
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: `Error: ${message}`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      scrollToBottom();
    }
  }, [inputText, member, isProcessing, scrollToBottom]);

  const renderMessageItem = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageBubbleRow, isUser ? styles.rowUser : styles.rowBot]}>
        {isUser ? null : (
          <View style={[styles.botAvatarCircle, { borderCurve: 'continuous' }]}>
            <Icon name="sparkles" size={12} tintColor={theme.colors.primary.DEFAULT} />
          </View>
        )}
        <View 
          style={[
            styles.messageBubble, 
            isUser ? styles.bubbleUser : styles.bubbleBot,
            { borderCurve: 'continuous' }
          ]}
        >
          <Typography.Paragraph style={isUser ? styles.textUser : styles.textBot}>
            {item.text}
          </Typography.Paragraph>
          <Typography.Label style={isUser ? styles.timeUser : styles.timeBot}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography.Label>
        </View>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  if (!member) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView 
        style={[styles.modalContainer, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Modal Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Typography.Label style={styles.avatarText}>
                {member.name.charAt(0).toUpperCase()}
              </Typography.Label>
            </View>
            <View>
              <Typography.Subheading style={styles.headerTitle}>
                Consult Benish
              </Typography.Subheading>
              <Typography.Label style={styles.headerSubtitle}>
                Health AI • {member.name}
              </Typography.Label>
            </View>
          </View>
          
          <Pressable 
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
              { borderCurve: 'continuous' }
            ]}
          >
            <Icon name="xmark" size={16} tintColor={theme.colors.text.primary} />
          </Pressable>
        </View>

        {/* Messages List */}
        <View style={styles.chatArea}>
          <FlashList
            ref={flashListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          
          {isProcessing ? (
            <View style={styles.loadingBubbleRow}>
              <View style={[styles.botAvatarCircle, { borderCurve: 'continuous' }]}>
                <Icon name="sparkles" size={12} tintColor={theme.colors.primary.DEFAULT} />
              </View>
              <View style={[styles.loadingBubble, { borderCurve: 'continuous' }]}>
                <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
              </View>
            </View>
          ) : null}
        </View>

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
          <TextInput
            placeholder={`Ask about ${member.name}'s records...`}
            value={inputText}
            onChangeText={setInputText}
            style={[styles.textInput, { borderCurve: 'continuous' }]}
            placeholderTextColor={theme.colors.text.tertiary}
            editable={!isProcessing}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isProcessing}
            style={({ pressed }) => [
              styles.sendButton,
              !inputText.trim() || isProcessing ? styles.sendButtonDisabled : null,
              pressed ? styles.sendButtonPressed : null,
              { borderCurve: 'continuous' }
            ]}
          >
            <Icon 
              name="paperplane.fill" 
              size={16}
              tintColor={!inputText.trim() || isProcessing ? theme.colors.text.tertiary : theme.colors.primary.content}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

ConsultModal.displayName = 'ConsultModal';

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: theme.colors.primary.DEFAULT,
  },
  headerTitle: {
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  closeIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.text.primary,
  },
  chatArea: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    maxWidth: '85%',
  },
  rowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  rowBot: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  botAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  botAvatarIcon: {
    width: 12,
    height: 12,
    tintColor: theme.colors.primary.DEFAULT,
  },
  messageBubble: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: 2,
  },
  bubbleUser: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderBottomRightRadius: 2,
  },
  bubbleBot: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderBottomLeftRadius: 2,
  },
  textUser: {
    color: theme.colors.primary.content,
    lineHeight: theme.lineHeight.md,
  },
  textBot: {
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeight.md,
  },
  timeUser: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  timeBot: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    alignSelf: 'flex-start',
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    marginLeft: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  loadingBubble: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderBottomLeftRadius: 2,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    maxHeight: 100,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.background.default,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  sendIcon: {
    width: 16,
    height: 16,
  },
});
