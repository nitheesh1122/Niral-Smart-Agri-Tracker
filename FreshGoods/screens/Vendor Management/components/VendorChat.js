// src/components/VendorChat.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  SafeAreaView, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Pusher from 'pusher-js';
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
 *   vendorId:   string   (logged-in vendor)
 *   chatType:   "customer" | "driver"
 *   targetId:   string   (customerId or driverId)
 *   targetName: string   (header label)
 *   onBack():   function (← handler)
 */
export default function VendorChat({
  vendorId: propVendorId,
  chatType,
  targetId,
  targetName = '',
  onBack,
}) {
  /* state */
  const [vendorId, setVendorId] = useState(propVendorId);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(true);
  const flatRef = useRef(null);

  /* 1️⃣ get vendorId from storage (if not passed) */
  useEffect(() => {
    if (vendorId) return;
    AsyncStorage.getItem('userId').then(id => id && setVendorId(id));
  }, [vendorId]);

  /* 2️⃣ Pusher + history */
  useEffect(() => {
    if (!vendorId || !targetId || !chatType) return;

    const channelName = `private-chat-${vendorId}-${targetId}`;

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: `${API_BASE}/chat/pusher/auth`,
      auth: { headers: { 'x-user-id': vendorId } },
    });

    const channel = pusher.subscribe(channelName);

    /* realtime */
    const handleNew = data =>
      setMessages(prev => {
        const next = [...prev, data];
        next.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return next;
      });

    channel.bind(CHAT_EVENT, handleNew);

    /* history */
    axios
      .get(`${API_BASE}/chat/history`, {
        params: { vendorId, targetId, chatType },
      })
      .then(res => {
        const ordered = res.data
          .slice()
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(ordered);
      })
      .finally(() => setLoading(false));

    return () => {
      channel.unbind(CHAT_EVENT, handleNew);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [vendorId, targetId, chatType]);

  /* 3️⃣ send */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const body = { vendorId, content: input };
    if (chatType === 'customer') body.customerId = targetId;
    if (chatType === 'driver')   body.driverId   = targetId;

    try {
      await axios.post(`${API_BASE}/chat/send`, body, {
        headers: { 'x-user-id': vendorId },
      });
      setInput('');
    } catch (err) {
      console.error('Send error', err);
    }
  };

  /* 4️⃣ auto-scroll */
  useEffect(() => {
    if (flatRef.current) flatRef.current.scrollToEnd({ animated: true });
  }, [messages]);

  /* helpers */
  const formatTime = ts =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderItem = ({ item }) => {
    const mine = item.senderId === vendorId;
    return (
      <View style={[styles.wrap, mine ? styles.alignRight : styles.alignLeft]}>
        <View style={[styles.bubble, mine ? styles.right : styles.left]}>
          <Text style={mine ? styles.textRight : styles.textLeft}>{item.content}</Text>
        </View>
        <Text style={styles.ts}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };

  /* loading */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  /* UI */
  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{targetName}</Text>
      </View>

      {/* messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item, i) => item._id || String(i)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
      />

      {/* composer */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            style={styles.input}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Text style={styles.sendTxt}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ *
 * STYLES
 * ------------------------------------------------------------------ */
const PRIMARY = '#007AFF';
const GREY_BG = '#ECECEC';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#ddd',
  },
  back:  { color: PRIMARY, marginRight: 10, fontSize: 16 },
  title: { fontSize: 18, fontWeight: '600', flex: 1 },

  wrap:  { marginVertical: 4, maxWidth: '75%' },
  alignLeft:  { alignSelf: 'flex-start', alignItems: 'flex-start' },
  alignRight: { alignSelf: 'flex-end',   alignItems: 'flex-end' },

  bubble: { padding: 10, borderRadius: 12 },
  left:   { backgroundColor: GREY_BG },
  right:  { backgroundColor: PRIMARY },
  textLeft:  { color: '#000' },
  textRight: { color: '#fff' },
  ts: { fontSize: 10, color: '#888', marginTop: 2 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
  },
  input: { flex: 1, backgroundColor: GREY_BG, padding: 10, borderRadius: 20 },
  sendBtn: {
    marginLeft: 8, backgroundColor: PRIMARY,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  sendTxt: { color: '#fff', fontWeight: 'bold' },
});
