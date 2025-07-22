"use client";

import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useState } from "react";

interface ReactionPickerProps {
  todoId: number;
  onReactionAdd: (emoji: string) => void;
}

export function ReactionPicker({ todoId, onReactionAdd }: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onReactionAdd(emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
      >
        😊 リアクション
      </button>

      {showPicker && (
        <div className="absolute top-full mt-2 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            autoFocusSearch={false}
            height={400}
            width={350}
          />
        </div>
      )}
    </div>
  );
}
