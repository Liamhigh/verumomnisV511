/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, MessageSender, Attachment, ApiParts } from './types';
import { getAssistantResponse } from './services/geminiService';
import KnowledgeBaseManager from './components/KnowledgeBaseManager'; // Will function as CaseWorkspace
import ChatInterface from './components/ChatInterface';
import { calculateSHA512, readTextFromFile } from './services/fileService';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [caseFiles, setCaseFiles] = useState<Attachment[]>([]);
  const caseFilesRef = useRef(caseFiles);

  useEffect(() => {
    caseFilesRef.current = caseFiles;
  }, [caseFiles]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setChatMessages(prev => [...prev, { ...message, id: `msg-${Date.now()}`, timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      addMessage({
        text: 'ERROR: Gemini API Key (process.env.API_KEY) is not configured. Please set this environment variable to use the application.',
        sender: MessageSender.SYSTEM,
      });
    } else {
      addMessage({
        text: "Welcome to Verum Omnis. Add files to the Case Workspace and begin your inquiry.",
        sender: MessageSender.SYSTEM,
      });
    }
  }, [addMessage]);

  const handleAddFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    addMessage({
      sender: MessageSender.SYSTEM,
      text: `Processing ${files.length} file(s)...`,
      isLoading: true,
    });

    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const hash = await calculateSHA512(file);
        const content = await readTextFromFile(file); // For context
        
        // Avoid adding duplicates
        if (!caseFilesRef.current.some(f => f.hash === hash)) {
          newAttachments.push({
            name: file.name,
            hash: hash,
            content: content,
          });
        }
      } catch (error) {
        console.error("Error processing file:", file.name, error);
        addMessage({
          sender: MessageSender.SYSTEM,
          text: `Error processing file: ${file.name}`,
        });
      }
    }
    
    setCaseFiles(prev => [...prev, ...newAttachments]);
    
    // Remove "Processing..." message
    setChatMessages(prev => prev.filter(m => !(m.isLoading && m.text.startsWith('Processing'))));
    
    addMessage({
      sender: MessageSender.SYSTEM,
      text: `Added ${newAttachments.length} new file(s) to the case. Their SHA-512 hashes are now available in the Case Workspace.`,
    });
  };

  const handleRemoveFile = (hashToRemove: string) => {
    setCaseFiles(prevFiles => prevFiles.filter(file => file.hash !== hashToRemove));
  };

  const handleSendMessage = async (query: string, attachedFiles?: FileList) => {
    if (attachedFiles && attachedFiles.length > 0) {
      await handleAddFiles(attachedFiles);
    }

    if (!query.trim()) return;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      addMessage({
        text: 'ERROR: API Key is not configured. Cannot send message.',
        sender: MessageSender.SYSTEM,
      });
      return;
    }
    
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: query,
      sender: MessageSender.USER,
      timestamp: new Date(),
      attachments: caseFiles, // Attach current case file state
    };
    
    const modelPlaceholderMessage: ChatMessage = {
      id: `model-${Date.now()}`,
      text: 'Thinking...', 
      sender: MessageSender.MODEL,
      timestamp: new Date(),
      isLoading: true,
    };

    setChatMessages(prev => [...prev, userMessage, modelPlaceholderMessage]);
    
    let context = "CASE FILE CONTEXT:\n";
    if (caseFilesRef.current.length > 0) {
      context += caseFilesRef.current.map(f => `File: ${f.name}\nContent: ${f.content}`).join('\n\n');
    } else {
      context += "No files have been added to the case yet.";
    }

    try {
      const response = await getAssistantResponse(query, context);
      
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === modelPlaceholderMessage.id
            ? { ...modelPlaceholderMessage, ...response, isLoading: false }
            : msg
        )
      );
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to get response from AI.';
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === modelPlaceholderMessage.id
            ? { ...modelPlaceholderMessage, text: `Error: ${errorMessage}`, sender: MessageSender.SYSTEM, isLoading: false } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const placeholderText = caseFiles.length > 0
    ? "Ask a question about the case files..."
    : "Add files to the Case Workspace to begin.";

  return (
    <div className="h-screen max-h-screen antialiased relative overflow-x-hidden bg-[#121212] text-[#E2E2E2]">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-sm z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">Citizen Mode</span>
        </div>
        <div className="text-xs text-gray-500 hidden md:block">
          Institutions pay after trial.
        </div>
      </header>
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div className="flex h-full w-full md:p-4 md:pt-16 md:gap-4">
        {/* Left Panel: Case Workspace */}
        <div className={`
          fixed top-0 left-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3 pt-12 md:pt-3
          md:static md:p-0 md:w-1/3 lg:w-1/4 md:h-full md:max-w-none md:translate-x-0 md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <KnowledgeBaseManager
            attachments={caseFiles}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            onCloseSidebar={() => setIsSidebarOpen(false)}
          />
        </div>

        {/* Right Panel: Legal Chat */}
        <div className="w-full h-full p-3 pt-14 md:p-0 md:w-2/3 lg:w-3/4">
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholderText={placeholderText}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onAddFiles={handleAddFiles}
          />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-2 text-center text-xs text-gray-600 hidden md:block">
        Privacy Disclaimer: All processing is done client-side.
      </footer>
    </div>
  );
};

export default App;
