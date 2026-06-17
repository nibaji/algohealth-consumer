import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  Pressable, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAvoiding } from '@/hooks/useKeyboardAvoiding';
import { Icon } from '@/components/ui/icon';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Typography } from '@/components/ui/Typography';
import { theme } from '@/constants/theme';
import { FamilyMemberOut } from '@/src/features/family/familyTypes';
import { medicalRecordService } from '@/src/services/medical-records/medicalRecordService';
import { consultCache, ChatMessage } from '@/src/utils/consultCache';
import * as DocumentPicker from 'expo-document-picker';
import { ConsultMessage } from './consult-message';
import { ConsultInput } from './consult-input';

interface ConsultModalProps {
  visible: boolean;
  onClose: () => void;
  member: FamilyMemberOut | null;
}

export const ConsultModal: React.FC<ConsultModalProps> = React.memo(({ visible, onClose, member }) => {
  const insets = useSafeAreaInsets();
  const keyboardAvoidingEnabled = useKeyboardAvoiding();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const flashListRef = useRef<FlashListRef<ChatMessage>>(null);

  // Initialize chat when modal opens
  useEffect(() => {
    if (visible && member) {
      const cached = consultCache.get(member.id);
      if (cached && cached.length > 0) {
        setMessages(cached);
      } else {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          text: `Hi! I am your Health Consultant, your AlgoHealth assistant. I have loaded ${member.name}'s medical records. How can I help you today?`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
      setIsProcessing(false);
      
      // Auto-scroll to bottom after rendering
      setTimeout(() => {
        if (flashListRef.current) {
          flashListRef.current.scrollToEnd({ animated: false });
        }
      }, 150);
    }
  }, [visible, member]);

  // Synchronize messages with cache
  useEffect(() => {
    if (member && messages.length > 0) {
      consultCache.set(member.id, messages);
    }
  }, [messages, member]);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    const currentRef = flashListRef.current;
    if (currentRef) {
      setTimeout(() => {
        currentRef.scrollToEnd({ animated: true });
      }, 100);
    }
  }, []);

  const handleSend = useCallback(async (
    text: string, 
    audioFile: DocumentPicker.DocumentPickerAsset | null, 
    docs: DocumentPicker.DocumentPickerAsset[]
  ) => {
    if (!member || isProcessing) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: text,
      sender: 'user',
      timestamp: new Date(),
      audio_uri: audioFile?.uri || null,
      documents: docs.map(d => ({ name: d.name, size: d.size })),
    };

    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();
    setIsProcessing(true);

    try {
      // Build FormData payload
      const formData = new FormData();
      formData.append('question', text);
      formData.append('family_member_id', member.id);

      // Append documents
      for (const doc of docs) {
        formData.append('files', {
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType || 'application/octet-stream',
        } as any);
      }

      // Append audio file
      if (audioFile) {
        formData.append('audio_files', {
          uri: audioFile.uri,
          name: audioFile.name,
          type: audioFile.mimeType || 'application/octet-stream',
        } as any);
      }

      const res = await medicalRecordService.consult(formData);
      
      // Extract response text
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
  }, [member, isProcessing, scrollToBottom]);

  const renderMessageItem = useCallback(({ item }: { item: ChatMessage }) => {
    return <ConsultMessage item={item} />;
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
        behavior="padding"
        enabled={keyboardAvoidingEnabled}
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
            <View style={{ flex: 1 }}>
              <Typography.Subheading 
                style={styles.headerTitle}
                truncate
              >
                Health Consultant
              </Typography.Subheading>
              <Typography.Label 
                style={styles.headerSubtitle}
                truncate
              >
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
        <ConsultInput onSend={handleSend} disabled={isProcessing} />
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
  chatArea: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
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
});
