import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Pusher from 'pusher-js';
import { IPADD } from '../../ipadd';

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */
const API_BASE       = `http://${IPADD}:5000`;
const PUSHER_KEY     = '562e97ac482dc6689524';
const PUSHER_CLUSTER = 'ap2';
const CHAT_EVENT     = 'new-message';

/**
 * Props:
 *   vendorId    – required
 *   vendorName  – optional header label
 *   customerId  – optional (fallback to AsyncStorage 'userId')
 *   onBack()    – optional
 */
export default function CustomerChat({
  vendorId,
  vendorName = 'Vendor',
  customerId: cidProp,
  onBack,
}) {
  const nav = useNavigation();
  const [customerId, setCustomerId] = useState(cidProp || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const flatRef = useRef(null);

  /* -------------------------------------------------------------- *
   * 1. Ensure we have customerId
   * -------------------------------------------------------------- */
  useEffect(() => {
    if (customerId) return;
    AsyncStorage.getItem('userId').then(id => id && setCustomerId(id));
  }, [customerId]);

  /* -------------------------------------------------------------- *
   * 2. Pusher + fetch history
   * -------------------------------------------------------------- */
  useEffect(() => {
    if (!customerId) return;

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: `${API_BASE}/chat/pusher/auth`,
      auth: { headers: { 'x-user-id': customerId } },
    });

    const channelName = `private-chat-${vendorId}-${customerId}`;
    const channel = pusher.subscribe(channelName);

    // Real-time message handling
    channel.bind(CHAT_EVENT, data => {
      setMessages(prev => {
        const updated = [...prev, data];
        updated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return updated;
      });
    });

    // Fetch chat history
    axios
      .get(`${API_BASE}/chat/history`, {
        params: {
          vendorId,
          targetId: customerId,
          chatType: 'customer',
        },
      })
      .then(res => {
        const ordered = res.data
          .slice()
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(ordered);
      })
      .finally(() => setLoading(false));

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [customerId, vendorId]);

  /* -------------------------------------------------------------- *
   * 3. Send
   * -------------------------------------------------------------- */
  const send = async () => {
    if (!input.trim()) return;
    try {
      await axios.post(
        `${API_BASE}/chat/send`,
        { vendorId, customerId, content: input },
        { headers: { 'x-user-id': customerId } },
      );
      setInput('');
    } catch (err) {
      console.error('send error', err);
    }
  };

  /* -------------------------------------------------------------- *
   * 4. Auto-scroll
   * -------------------------------------------------------------- */
  useEffect(() => {
    if (flatRef.current) flatRef.current.scrollToEnd({ animated: true });
  }, [messages]);

  /* -------------------------------------------------------------- *
   * 5. UI helpers
   * -------------------------------------------------------------- */
  const formatTime = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const bubble = ({ item }) => {
    const mine = item.senderId === customerId;
    return (
      <View style={[styles.bubbleWrapper, mine ? styles.alignRight : styles.alignLeft]}>
        <View style={[styles.bubble, mine ? styles.right : styles.left]}>
          <Text style={mine ? styles.textRight : styles.textLeft}>{item.content}</Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };

  const back = () => (onBack ? onBack() : nav.goBack());

  /* -------------------------------------------------------------- *
   * 6. Render
   * -------------------------------------------------------------- */
  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={back}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{vendorName}</Text>
      </View>

      {/* messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item, i) => item._id || String(i)}
        renderItem={bubble}
        contentContainerStyle={{ padding: 12 }}
      />

      {/* compose bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.row}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            style={styles.input}
            onSubmitEditing={send}
          />
          <TouchableOpacity onPress={send} style={styles.sendBtn}>
            <Text style={styles.sendTxt}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ *
 * Styles
 * ------------------------------------------------------------------ */
const PRIMARY = '#007AFF';
const GREY_BG = '#ECECEC';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#ddd',
  },
  backBtn: { color: PRIMARY, marginRight: 10, fontSize: 16 },
  title: { fontSize: 18, fontWeight: '600', flex: 1 },

  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '75%',
  },
  alignLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
  },
  left: {
    backgroundColor: GREY_BG,
  },
  right: {
    backgroundColor: PRIMARY,
  },
  textLeft: { color: '#000' },
  textRight: { color: '#fff' },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
  },
  input: { flex: 1, backgroundColor: GREY_BG, padding: 10, borderRadius: 20 },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendTxt: { color: '#fff', fontWeight: 'bold' },
});
