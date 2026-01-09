// src/components/DriverChat.js  (Pusher real-time)
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import Pusher from 'pusher-js/react-native';
import { IPADD } from '../../ipadd';

/* ------------------------------------------------------------------ *
 * CONFIG
 * ------------------------------------------------------------------ */
const API_BASE       = `http://${IPADD}:5000`;
const PUSHER_KEY     = '562e97ac482dc6689524';
const PUSHER_CLUSTER = 'ap2';
const CHAT_EVENT     = 'new-message';

/**
 * Props:
 *   driverId   – logged-in driver (string)
 *   vendorId   – chatting vendor (string)
 *   vendorName – optional for header
 *   onBack()   – optional
 */
export default function DriverChat({ driverId, vendorId, vendorName = 'Vendor', onBack }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const flatRef = useRef(null);

  /* ---------------- 1. Fetch history + Pusher ---------------- */
  useEffect(() => {
    if (!vendorId || !driverId) return;

    // 1-a  History
    axios.get(`${API_BASE}/chat/history`, {
      params: { vendorId, targetId: driverId, chatType: 'driver' },
    })
    .then(res => {
      const ordered = res.data
        .slice()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessages(ordered);
    })
    .finally(() => setLoading(false));

    // 1-b  Pusher realtime
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: `${API_BASE}/chat/pusher/auth`,
      auth: { headers: { 'x-user-id': driverId } },
    });

    const channelName = `private-chat-${vendorId}-${driverId}`;
    const channel     = pusher.subscribe(channelName);

    const handleNew = (data) =>
      setMessages(prev => {
        const next = [...prev, data];
        next.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return next;
      });

    channel.bind(CHAT_EVENT, handleNew);

    return () => {
      channel.unbind(CHAT_EVENT, handleNew);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [vendorId, driverId]);

  /* ---------------- 2. Send message ---------------- */
  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      await axios.post(
        `${API_BASE}/chat/send`,
        { vendorId, driverId, content: input },
        { headers: { 'x-user-id': driverId } },
      );
      setInput('');
      // optimistic insert handled by realtime callback
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  /* ---------------- 3. Scroll on new messages ---------------- */
  useEffect(() => {
    if (flatRef.current) flatRef.current.scrollToEnd({ animated: true });
  }, [messages]);

  /* ---------------- 4. Helpers ---------------- */
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderItem = ({ item }) => {
    const mine = item.senderId === driverId;
    return (
      <View style={[styles.bubbleWrap, mine ? styles.alignRight : styles.alignLeft]}>
        <View style={[styles.msg, mine ? styles.right : styles.left]}>
          <Text style={mine ? styles.txtRight : styles.txtLeft}>{item.content}</Text>
        </View>
        <Text style={styles.ts}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };

  /* ---------------- 5. UI ---------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{vendorName}</Text>
      </View>

      {/* messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item, idx) => item._id || String(idx)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
      />

      {/* composer */}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message…"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendTxt}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------------------------------ *
 * Styles
 * ------------------------------------------------------------------ */
const PRIMARY = '#007AFF';
const GREY_BG = '#E4E6EB';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#ddd',
  },
  back:  { marginRight: 10, color: PRIMARY, fontSize: 16 },
  title: { fontSize: 18, fontWeight: '600' },

  bubbleWrap: { marginVertical: 4, maxWidth: '75%' },
  alignLeft:  { alignSelf: 'flex-start', alignItems: 'flex-start' },
  alignRight: { alignSelf: 'flex-end',   alignItems: 'flex-end' },

  msg: { padding: 10, borderRadius: 10 },
  left:  { backgroundColor: GREY_BG },
  right: { backgroundColor: PRIMARY },

  txtLeft:  { color: '#000' },
  txtRight: { color: '#fff' },
  ts: { fontSize: 10, color: '#888', marginTop: 2 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
  },
  input: {
    flex: 1, backgroundColor: '#f1f1f1',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
  },
  sendBtn: { backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  sendTxt: { color: '#fff', fontWeight: 'bold' },
});
