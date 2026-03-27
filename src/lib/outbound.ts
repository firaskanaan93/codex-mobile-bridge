import { queueMessage } from "@/lib/mobile-queue";
import type { QueuedMessageRecord } from "@/lib/types";

export interface CodexOutboundTransport {
  send(threadId: string, body: string): Promise<QueuedMessageRecord>;
}

export class QueuedOnlyTransport implements CodexOutboundTransport {
  async send(threadId: string, body: string): Promise<QueuedMessageRecord> {
    return queueMessage(threadId, body);
  }
}
