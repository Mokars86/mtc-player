import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PartyEvent {
    type: 'play' | 'pause' | 'seek' | 'track_change' | 'sync_request' | 'sync_response';
    payload: any;
    timestamp: number;
    senderId: string;
}

export interface PartyState {
    roomId: string;
    isHost: boolean;
    userCount: number;
    hostName?: string;
}

class PartySessionService {
    private channel: RealtimeChannel | null = null;
    private roomId: string | null = null;
    private userId: string;
    private callbacks: ((event: PartyEvent) => void)[] = [];
    private stateCallbacks: ((state: PartyState) => void)[] = [];

    // State
    private isHost: boolean = false;
    private userCount: number = 0;

    constructor() {
        this.userId = `user-${Math.random().toString(36).substring(2, 9)}`;
    }

    public async createSession(roomId: string, isHost: boolean, userName: string) {
        if (this.channel) await this.leaveSession();

        this.roomId = roomId;
        this.isHost = isHost;
        this.userCount = 1;

        console.log(`Joining party ${roomId} as ${isHost ? 'Host' : 'Guest'}`);

        this.channel = supabase.channel(`party:${roomId}`, {
            config: {
                presence: {
                    key: this.userId,
                },
                broadcast: { self: false } // Don't receive own messages
            }
        });

        this.channel
            .on('broadcast', { event: 'player_action' }, (payload) => {
                this.handleBroadcast(payload.payload as PartyEvent);
            })
            .on('presence', { event: 'sync' }, () => {
                const newState = this.channel?.presenceState();
                if (newState) {
                    this.userCount = Object.keys(newState).length;
                    this.notifyState();
                }
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                console.log('User joined:', newPresences);
                this.userCount += newPresences.length;
                this.notifyState();

                // If I am host, send current state to new joiners
                if (this.isHost) {
                    // Request Sync logic could go here
                }
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                console.log('User left:', leftPresences);
                this.userCount = Math.max(1, this.userCount - leftPresences.length);
                this.notifyState();
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await this.channel?.track({
                        online_at: new Date().toISOString(),
                        is_host: isHost,
                        user_name: userName
                    });
                    this.notifyState();
                }
            });

        this.notifyState();
    }

    public async leaveSession() {
        if (this.channel) {
            await this.channel.unsubscribe();
            this.channel = null;
            this.roomId = null;
            this.isHost = false;
            this.userCount = 0;
            this.notifyState();
        }
    }

    public broadcast(type: PartyEvent['type'], payload: any) {
        if (!this.channel || !this.roomId) return;

        // Only host sends impactful commands, but guests might send 'sync_request'
        if (!this.isHost && type !== 'sync_request') return;

        const event: PartyEvent = {
            type,
            payload,
            timestamp: Date.now(),
            senderId: this.userId
        };

        this.channel.send({
            type: 'broadcast',
            event: 'player_action',
            payload: event
        });
    }

    public onEvent(callback: (event: PartyEvent) => void) {
        this.callbacks.push(callback);
    }

    public offEvent(callback: (event: PartyEvent) => void) {
        this.callbacks = this.callbacks.filter(c => c !== callback);
    }

    public onStateChange(callback: (state: PartyState) => void) {
        this.stateCallbacks.push(callback);
    }

    public offStateChange(callback: (state: PartyState) => void) {
        this.stateCallbacks = this.stateCallbacks.filter(c => c !== callback);
    }

    private handleBroadcast(event: PartyEvent) {
        this.callbacks.forEach(cb => cb(event));
    }

    private notifyState() {
        if (!this.roomId) return;
        const state: PartyState = {
            roomId: this.roomId,
            isHost: this.isHost,
            userCount: this.userCount
        };
        this.stateCallbacks.forEach(cb => cb(state));
    }

    public getUserId() {
        return this.userId;
    }
}

export const partySession = new PartySessionService();
