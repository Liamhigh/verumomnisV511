/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback } from 'react';
import { X, File, Copy, Trash2, ShieldCheck, FileClock, Filter } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Attachment } from '../types';

interface CaseWorkspaceProps {
  attachments: Attachment[];
  onAddFiles: (files: FileList) => void;
  onRemoveFile: (hash: string) => void;
  onCloseSidebar?: () => void;
}

const CaseWorkspace: React.FC<CaseWorkspaceProps> = ({ 
  attachments, 
  onAddFiles,
  onRemoveFile,
  onCloseSidebar,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const dataTransfer = new DataTransfer();
    acceptedFiles.forEach(file => dataTransfer.items.add(file));
    onAddFiles(dataTransfer.files);
  }, [onAddFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
  };

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 bg-[#1E1E1E] shadow-md rounded-xl h-full flex flex-col border border-[rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-[#E2E2E2]">Case Workspace</h2>
        {onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            className="p-1 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors md:hidden"
            aria-label="Close Case Workspace"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <div 
        {...getRootProps()}
        onClick={handleFileSelectClick}
        className={`cursor-pointer border-2 border-dashed border-[#4A4A4A] hover:border-[#777] rounded-lg p-4 flex flex-col items-center justify-center text-[#A8ABB4] transition-colors mb-4 ${isDragActive ? 'bg-[#4A4A4A]/50 border-blue-400' : ''}`}
      >
        <input {...getInputProps()} ref={fileInputRef} multiple />
        <File size={24} className="mb-2" />
        <span className="font-semibold text-sm">Drop files here</span>
        <span className="text-xs mt-1">or click to select</span>
      </div>

      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="font-medium text-[#A8ABB4]">Case Filter</span>
        <div className="flex items-center gap-1 p-0.5 bg-[#2C2C2C] rounded-md">
          <button className="px-2 py-0.5 text-xs bg-[#4A4A4A] rounded text-white">All</button>
          <button className="px-2 py-0.5 text-xs text-[#A8ABB4]">Incidents</button>
          <button className="px-2 py-0.5 text-xs text-[#A8ABB4]">Sealed</button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 chat-container pr-1">
        {attachments.length === 0 ? (
          <p className="text-[#777777] text-center py-3 text-sm">No files in this case.</p>
        ) : (
          attachments.map((file) => (
            <div key={file.hash} className="flex items-center justify-between p-2 bg-[#2C2C2C] border border-[rgba(255,255,255,0.05)] rounded-lg text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <File className="text-[#A8ABB4] flex-shrink-0" size={16}/>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-white truncate font-medium" title={file.name}>{file.name}</span>
                  <span className="text-[#777777] truncate font-mono" title={file.hash}>
                    SHA512: {file.hash.substring(0, 12)}...
                  </span>
                </div>
              </div>
              <div className="flex items-center flex-shrink-0 ml-2">
                <button 
                  onClick={() => handleCopyHash(file.hash)}
                  className="p-1 text-[#A8ABB4] hover:text-[#79B8FF] rounded-md hover:bg-white/10"
                  aria-label={`Copy hash for ${file.name}`}
                >
                  <Copy size={14} />
                </button>
                <button 
                  onClick={() => onRemoveFile(file.hash)}
                  className="p-1 text-[#A8ABB4] hover:text-[#f87171] rounded-md hover:bg-white/10"
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex-shrink-0 pt-2 mt-2 border-t border-[rgba(255,255,255,0.05)] space-y-2">
         <div className="text-sm font-medium text-[#A8ABB4]">Timeline &amp; Notes</div>
         <div className="p-4 bg-[#2C2C2C] rounded-md text-xs text-[#777777] text-center">
            Timeline feature placeholder.
         </div>
         <div className="p-4 bg-[#2C2C2C] rounded-md text-xs text-[#777777] text-center">
            Notes feature placeholder.
         </div>
      </div>
    </div>
  );
};

export default CaseWorkspace;
