/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum MessageSender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface Attachment {
  name: string;
  hash: string;
  content?: string; // Content for context, may not always be present
}

export interface ApiParts {
  api1Response?: string;
  api2Response?: string;
  consensusText?: string;
  isDivergent?: boolean;
}

export interface AssistantResponse extends ApiParts {
  text: string;
}

export interface ChatMessage extends AssistantResponse {
  id: string;
  sender: MessageSender;
  timestamp: Date;
  isLoading?: boolean;
  attachments?: Attachment[];
}
